import { readDb, mutateDb } from "@/lib/store/db";
import { newId, newToken } from "@/lib/id";
import { DEFAULT_ORG_ID } from "@/lib/store/seed";
import { storage } from "@/lib/storage";
import type {
  ActivityLog,
  Client,
  ClientWithProgress,
  DocumentRequest,
  RequestWithDocs,
  UploadedDocSummary,
} from "@/lib/types";

/**
 * Repository layer. Pages/API routes call these, never lib/store/db.ts or
 * lib/types.ts directly-mutated arrays. This is the seam that becomes
 * Supabase queries later — see PLAN.md §6.
 */

export function getCurrentOrgId(): string {
  return DEFAULT_ORG_ID;
}

// ---------- derived/computed shapes ----------

function requestProgress(
  db: ReturnType<typeof readDb>,
  request: DocumentRequest
): RequestWithDocs {
  const required = db.required_documents
    .filter((rd) => rd.request_id === request.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((rd) => {
      const current =
        db.uploaded_documents.find(
          (ud) => ud.required_document_id === rd.id && ud.is_current
        ) ?? null;
      return { ...rd, current };
    });

  const received_count = required.filter((r) => r.current).length;

  return {
    ...request,
    required,
    received_count,
    total_count: required.length,
  };
}

function clientProgress(
  db: ReturnType<typeof readDb>,
  client: Client
): ClientWithProgress {
  const runs = db.document_requests
    .filter((r) => r.client_id === client.id)
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  let received_count = 0;
  let total_count = 0;
  let hasPending = false;
  let hasComplete = false;

  for (const run of runs) {
    const withDocs = requestProgress(db, run);
    received_count += withDocs.received_count;
    total_count += withDocs.total_count;
    if (run.status === "complete") hasComplete = true;
    else hasPending = true;
  }

  const status: ClientWithProgress["status"] =
    runs.length === 0
      ? "none"
      : hasPending && hasComplete
        ? "mixed"
        : hasPending
          ? "pending"
          : "complete";

  const lastActivity = db.activity_logs
    .filter((a) => a.client_id === client.id)
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

  return {
    ...client,
    runs,
    received_count,
    total_count,
    status,
    last_activity_at: lastActivity?.created_at ?? null,
  };
}

// ---------- clients ----------

export function listClients(): ClientWithProgress[] {
  const db = readDb();
  const orgId = getCurrentOrgId();
  return db.clients
    .filter((c) => c.org_id === orgId)
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map((c) => clientProgress(db, c));
}

export function getClient(clientId: string): ClientWithProgress | null {
  const db = readDb();
  const client = db.clients.find((c) => c.id === clientId);
  if (!client) return null;
  return clientProgress(db, client);
}

export function createClient(input: {
  name: string;
  email: string;
  phone: string;
}): Client {
  return mutateDb((db) => {
    const client: Client = {
      id: newId("client"),
      org_id: getCurrentOrgId(),
      name: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      created_at: new Date().toISOString(),
    };
    db.clients.push(client);
    db.activity_logs.unshift({
      id: newId("act"),
      org_id: client.org_id,
      client_id: client.id,
      request_id: null,
      type: "client_created",
      message: `${client.name} was added as a client`,
      created_at: client.created_at,
    });
    return client;
  });
}

// ---------- document requests (collection runs) ----------

export function listRequests(): (RequestWithDocs & { client_name: string })[] {
  const db = readDb();
  const orgId = getCurrentOrgId();
  return db.document_requests
    .filter((r) => r.org_id === orgId)
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .map((r) => {
      const client = db.clients.find((c) => c.id === r.client_id);
      return { ...requestProgress(db, r), client_name: client?.name ?? "Unknown" };
    });
}

export function getRequest(requestId: string): RequestWithDocs | null {
  const db = readDb();
  const request = db.document_requests.find((r) => r.id === requestId);
  if (!request) return null;
  return requestProgress(db, request);
}

export function getRequestByToken(
  token: string
): (RequestWithDocs & { org_name: string; client_name: string }) | null {
  const db = readDb();
  const request = db.document_requests.find((r) => r.token === token);
  if (!request) return null;
  const org = db.organizations.find((o) => o.id === request.org_id);
  const client = db.clients.find((c) => c.id === request.client_id);
  return {
    ...requestProgress(db, request),
    org_name: org?.name ?? "ClientCollect",
    client_name: client?.name ?? "",
  };
}

/** Marks first_opened_at + logs the event, only on the first visit. */
export function markLinkOpened(token: string): void {
  mutateDb((db) => {
    const request = db.document_requests.find((r) => r.token === token);
    if (!request || request.first_opened_at) return;
    request.first_opened_at = new Date().toISOString();
    const client = db.clients.find((c) => c.id === request.client_id);
    db.activity_logs.unshift({
      id: newId("act"),
      org_id: request.org_id,
      client_id: request.client_id,
      request_id: request.id,
      type: "link_opened",
      message: `${client?.name ?? "Client"} opened the upload link`,
      created_at: request.first_opened_at,
    });
  });
}

export function createRequest(input: {
  clientId: string;
  label: string;
  description: string | null;
  documentNames: string[];
}): DocumentRequest {
  return mutateDb((db) => {
    const client = db.clients.find((c) => c.id === input.clientId);
    if (!client) throw new Error("Client not found");

    const request: DocumentRequest = {
      id: newId("req"),
      org_id: getCurrentOrgId(),
      client_id: input.clientId,
      label: input.label.trim(),
      description: input.description?.trim() || null,
      token: newToken(),
      status: "pending",
      created_at: new Date().toISOString(),
      first_opened_at: null,
      completed_at: null,
    };
    db.document_requests.push(request);

    input.documentNames.forEach((name, idx) => {
      db.required_documents.push({
        id: newId("rd"),
        request_id: request.id,
        name: name.trim(),
        sort_order: idx,
      });
    });

    db.activity_logs.unshift({
      id: newId("act"),
      org_id: request.org_id,
      client_id: client.id,
      request_id: request.id,
      type: "request_created",
      message: `${request.label} request created for ${client.name}`,
      created_at: request.created_at,
    });

    return request;
  });
}

export function sendReminder(requestId: string): void {
  mutateDb((db) => {
    const request = db.document_requests.find((r) => r.id === requestId);
    if (!request) return;
    const client = db.clients.find((c) => c.id === request.client_id);
    db.activity_logs.unshift({
      id: newId("act"),
      org_id: request.org_id,
      client_id: request.client_id,
      request_id: request.id,
      type: "reminder_sent",
      message: `Reminder sent to ${client?.name ?? "client"} for ${request.label}`,
      created_at: new Date().toISOString(),
    });
  });
}

// ---------- uploads ----------

export async function uploadDocument(input: {
  requiredDocumentId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<UploadedDocSummary> {
  const db = readDb();
  const rd = db.required_documents.find((d) => d.id === input.requiredDocumentId);
  if (!rd) throw new Error("Required document not found");
  const request = db.document_requests.find((r) => r.id === rd.request_id);
  if (!request) throw new Error("Request not found");

  const previous = db.uploaded_documents.find(
    (ud) => ud.required_document_id === rd.id && ud.is_current
  );
  const isReplace = Boolean(previous);
  const nextVersion = previous ? previous.version + 1 : 1;
  const docId = newId("ud");

  const key = `${rd.request_id}/${rd.id}/${newId("up")}-${input.fileName}`;
  const storageKey = await storage.put({
    key,
    buffer: input.buffer,
    mimeType: input.mimeType,
  });

  mutateDb((writable) => {
    const writableRd = writable.required_documents.find((d) => d.id === rd.id)!;
    const writableRequest = writable.document_requests.find(
      (r) => r.id === writableRd.request_id
    )!;
    const client = writable.clients.find((c) => c.id === writableRequest.client_id);

    const prev = writable.uploaded_documents.find(
      (ud) => ud.required_document_id === writableRd.id && ud.is_current
    );
    if (prev) prev.is_current = false;

    writable.uploaded_documents.push({
      id: docId,
      required_document_id: writableRd.id,
      file_name: input.fileName,
      storage_key: storageKey,
      mime_type: input.mimeType,
      size_bytes: input.buffer.byteLength,
      version: nextVersion,
      is_current: true,
      uploaded_at: new Date().toISOString(),
    });

    writable.activity_logs.unshift({
      id: newId("act"),
      org_id: writableRequest.org_id,
      client_id: writableRequest.client_id,
      request_id: writableRequest.id,
      type: isReplace ? "document_replaced" : "document_uploaded",
      message: `${client?.name ?? "Client"} ${isReplace ? "replaced" : "uploaded"} ${input.fileName}`,
      created_at: new Date().toISOString(),
    });

    // recompute completion
    const allRds = writable.required_documents.filter(
      (d) => d.request_id === writableRequest.id
    );
    const allCurrent = allRds.every((d) =>
      writable.uploaded_documents.some(
        (ud) => ud.required_document_id === d.id && ud.is_current
      )
    );

    if (allCurrent && writableRequest.status !== "complete") {
      writableRequest.status = "complete";
      writableRequest.completed_at = new Date().toISOString();
      writable.activity_logs.unshift({
        id: newId("act"),
        org_id: writableRequest.org_id,
        client_id: writableRequest.client_id,
        request_id: writableRequest.id,
        type: "request_completed",
        message: `${client?.name ?? "Client"} completed the ${writableRequest.label} request`,
        created_at: writableRequest.completed_at,
      });
    } else if (!allCurrent && writableRequest.status === "complete") {
      writableRequest.status = "pending";
      writableRequest.completed_at = null;
    }
  });

  const url = await storage.signedGetUrl(storageKey);
  return { id: docId, file_name: input.fileName, size_bytes: input.buffer.byteLength, url };
}

export async function removeDocument(requiredDocumentId: string): Promise<void> {
  const db = readDb();
  const current = db.uploaded_documents.find(
    (ud) => ud.required_document_id === requiredDocumentId && ud.is_current
  );
  if (!current) return;
  await storage.remove(current.storage_key);

  mutateDb((writable) => {
    const ud = writable.uploaded_documents.find((u) => u.id === current.id);
    if (ud) ud.is_current = false;

    const rd = writable.required_documents.find((d) => d.id === requiredDocumentId);
    if (!rd) return;
    const request = writable.document_requests.find((r) => r.id === rd.request_id);
    if (!request) return;
    const client = writable.clients.find((c) => c.id === request.client_id);

    if (request.status === "complete") {
      request.status = "pending";
      request.completed_at = null;
    }

    writable.activity_logs.unshift({
      id: newId("act"),
      org_id: request.org_id,
      client_id: request.client_id,
      request_id: request.id,
      type: "document_removed",
      message: `${client?.name ?? "Client"} removed ${current.file_name}`,
      created_at: new Date().toISOString(),
    });
  });
}

export async function getDocumentUrl(uploadedDocumentId: string): Promise<string | null> {
  const db = readDb();
  const doc = db.uploaded_documents.find((d) => d.id === uploadedDocumentId);
  if (!doc) return null;
  return storage.signedGetUrl(doc.storage_key);
}

// ---------- activity ----------

export function listActivity(): ActivityLog[] {
  const db = readDb();
  const orgId = getCurrentOrgId();
  return db.activity_logs
    .filter((a) => a.org_id === orgId)
    .sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
}

// ---------- dashboard ----------

export function getDashboardStats() {
  const db = readDb();
  const orgId = getCurrentOrgId();
  const clients = db.clients.filter((c) => c.org_id === orgId);
  const requests = db.document_requests.filter((r) => r.org_id === orgId);
  const pendingRequests = requests.filter((r) => r.status === "pending");

  let documentsAwaiting = 0;
  for (const r of pendingRequests) {
    const withDocs = requestProgress(db, r);
    documentsAwaiting += withDocs.total_count - withDocs.received_count;
  }

  return {
    totalClients: clients.length,
    pendingRequests: pendingRequests.length,
    documentsAwaiting,
  };
}
