import { getSupabase } from "@/lib/supabase/client";
import { storage } from "@/lib/storage";
import { newId, newToken } from "@/lib/id";
import { SUPABASE_DEFAULT_ORG_ID, buildSupabaseSeed } from "@/lib/store/seed-supabase";
import type {
  ActivityLog,
  Client,
  ClientWithProgress,
  DocumentRequest,
  RequestWithDocs,
  RequiredDocument,
  UploadedDocument,
} from "@/lib/types";

/**
 * Supabase-backed implementation of the repository layer — same exported
 * function names/signatures as lib/store/json-queries.ts. lib/store/queries.ts
 * dispatches to whichever of the two is active based on env config.
 */

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export function getCurrentOrgId(): string {
  return SUPABASE_DEFAULT_ORG_ID;
}

// ---------- shared fetch helpers ----------

type RequiredWithCurrent = RequiredDocument & { current: UploadedDocument | null };

async function fetchRequiredWithCurrent(
  requestIds: string[]
): Promise<Map<string, RequiredWithCurrent[]>> {
  const map = new Map<string, RequiredWithCurrent[]>();
  if (requestIds.length === 0) return map;
  const sb = getSupabase();

  const rds = unwrap<RequiredDocument[]>(
    await sb
      .from("cc_required_documents")
      .select("*")
      .in("request_id", requestIds)
      .order("sort_order", { ascending: true })
  );

  const rdIds = rds.map((r) => r.id);
  const uds = rdIds.length
    ? unwrap<UploadedDocument[]>(
        await sb
          .from("cc_uploaded_documents")
          .select("*")
          .in("required_document_id", rdIds)
          .eq("is_current", true)
      )
    : [];

  const currentByRdId = new Map(uds.map((u) => [u.required_document_id, u]));

  for (const rd of rds) {
    const list = map.get(rd.request_id) ?? [];
    list.push({ ...rd, current: currentByRdId.get(rd.id) ?? null });
    map.set(rd.request_id, list);
  }
  return map;
}

function toRequestWithDocs(
  request: DocumentRequest,
  requiredMap: Map<string, RequiredWithCurrent[]>
): RequestWithDocs {
  const required = requiredMap.get(request.id) ?? [];
  const received_count = required.filter((r) => r.current).length;
  return { ...request, required, received_count, total_count: required.length };
}

// ---------- clients ----------

export async function listClients(): Promise<ClientWithProgress[]> {
  const sb = getSupabase();
  const orgId = getCurrentOrgId();

  const clients = unwrap<Client[]>(
    await sb.from("cc_clients").select("*").eq("org_id", orgId).order("created_at", { ascending: false })
  );
  if (clients.length === 0) return [];

  const clientIds = clients.map((c) => c.id);
  const requests = unwrap<DocumentRequest[]>(
    await sb.from("cc_document_requests").select("*").in("client_id", clientIds)
  );
  const requiredMap = await fetchRequiredWithCurrent(requests.map((r) => r.id));

  const activity = unwrap<{ client_id: string | null; created_at: string }[]>(
    await sb
      .from("cc_activity_logs")
      .select("client_id, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
  );
  const lastActivityByClient = new Map<string, string>();
  for (const a of activity) {
    if (a.client_id && !lastActivityByClient.has(a.client_id)) {
      lastActivityByClient.set(a.client_id, a.created_at);
    }
  }

  return clients.map((c) => {
    const runs = requests
      .filter((r) => r.client_id === c.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let received_count = 0;
    let total_count = 0;
    let hasPending = false;
    let hasComplete = false;
    for (const run of runs) {
      const wd = toRequestWithDocs(run, requiredMap);
      received_count += wd.received_count;
      total_count += wd.total_count;
      if (run.status === "complete") hasComplete = true;
      else hasPending = true;
    }

    const status: ClientWithProgress["status"] =
      runs.length === 0 ? "none" : hasPending && hasComplete ? "mixed" : hasPending ? "pending" : "complete";

    return {
      ...c,
      runs,
      received_count,
      total_count,
      status,
      last_activity_at: lastActivityByClient.get(c.id) ?? null,
    };
  });
}

export async function getClient(clientId: string): Promise<ClientWithProgress | null> {
  const sb = getSupabase();

  const clientRows = unwrap<Client[]>(
    await sb.from("cc_clients").select("*").eq("id", clientId).limit(1)
  );
  const client = clientRows[0];
  if (!client) return null;

  const runs = unwrap<DocumentRequest[]>(
    await sb
      .from("cc_document_requests")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
  );
  const requiredMap = await fetchRequiredWithCurrent(runs.map((r) => r.id));

  let received_count = 0;
  let total_count = 0;
  let hasPending = false;
  let hasComplete = false;
  for (const run of runs) {
    const wd = toRequestWithDocs(run, requiredMap);
    received_count += wd.received_count;
    total_count += wd.total_count;
    if (run.status === "complete") hasComplete = true;
    else hasPending = true;
  }
  const status: ClientWithProgress["status"] =
    runs.length === 0 ? "none" : hasPending && hasComplete ? "mixed" : hasPending ? "pending" : "complete";

  const lastActivityRows = unwrap<{ created_at: string }[]>(
    await sb
      .from("cc_activity_logs")
      .select("created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1)
  );

  return {
    ...client,
    runs,
    received_count,
    total_count,
    status,
    last_activity_at: lastActivityRows[0]?.created_at ?? null,
  };
}

export async function createClient(input: {
  name: string;
  email: string;
  phone: string;
}): Promise<Client> {
  const sb = getSupabase();
  const client: Client = {
    id: newId("client"),
    org_id: getCurrentOrgId(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    created_at: new Date().toISOString(),
  };

  unwrap(await sb.from("cc_clients").insert(client));
  unwrap(
    await sb.from("cc_activity_logs").insert({
      id: newId("act"),
      org_id: client.org_id,
      client_id: client.id,
      request_id: null,
      type: "client_created",
      message: `${client.name} was added as a client`,
      created_at: client.created_at,
    })
  );

  return client;
}

// ---------- document requests (collection runs) ----------

export async function listRequests(): Promise<(RequestWithDocs & { client_name: string })[]> {
  const sb = getSupabase();
  const orgId = getCurrentOrgId();

  const requests = unwrap<DocumentRequest[]>(
    await sb
      .from("cc_document_requests")
      .select("*")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
  );
  if (requests.length === 0) return [];

  const requiredMap = await fetchRequiredWithCurrent(requests.map((r) => r.id));
  const clientIds = [...new Set(requests.map((r) => r.client_id))];
  const clients = unwrap<{ id: string; name: string }[]>(
    await sb.from("cc_clients").select("id, name").in("id", clientIds)
  );
  const nameById = new Map(clients.map((c) => [c.id, c.name]));

  return requests.map((r) => ({
    ...toRequestWithDocs(r, requiredMap),
    client_name: nameById.get(r.client_id) ?? "Unknown",
  }));
}

export async function getRequest(requestId: string): Promise<RequestWithDocs | null> {
  const sb = getSupabase();
  const rows = unwrap<DocumentRequest[]>(
    await sb.from("cc_document_requests").select("*").eq("id", requestId).limit(1)
  );
  const request = rows[0];
  if (!request) return null;
  const requiredMap = await fetchRequiredWithCurrent([requestId]);
  return toRequestWithDocs(request, requiredMap);
}

export async function getRequestByToken(
  token: string
): Promise<(RequestWithDocs & { org_name: string; client_name: string }) | null> {
  const sb = getSupabase();
  const rows = unwrap<DocumentRequest[]>(
    await sb.from("cc_document_requests").select("*").eq("token", token).limit(1)
  );
  const request = rows[0];
  if (!request) return null;

  const [orgRows, clientRows, requiredMap] = await Promise.all([
    sb.from("cc_organizations").select("name").eq("id", request.org_id).limit(1).then(unwrap<{ name: string }[]>),
    sb.from("cc_clients").select("name").eq("id", request.client_id).limit(1).then(unwrap<{ name: string }[]>),
    fetchRequiredWithCurrent([request.id]),
  ]);

  return {
    ...toRequestWithDocs(request, requiredMap),
    org_name: orgRows[0]?.name ?? "ClientCollect",
    client_name: clientRows[0]?.name ?? "",
  };
}

export async function markLinkOpened(token: string): Promise<void> {
  const sb = getSupabase();
  const rows = unwrap<DocumentRequest[]>(
    await sb.from("cc_document_requests").select("*").eq("token", token).limit(1)
  );
  const request = rows[0];
  if (!request || request.first_opened_at) return;

  const now = new Date().toISOString();
  unwrap(await sb.from("cc_document_requests").update({ first_opened_at: now }).eq("id", request.id));

  const clientRows = unwrap<{ name: string }[]>(
    await sb.from("cc_clients").select("name").eq("id", request.client_id).limit(1)
  );

  unwrap(
    await sb.from("cc_activity_logs").insert({
      id: newId("act"),
      org_id: request.org_id,
      client_id: request.client_id,
      request_id: request.id,
      type: "link_opened",
      message: `${clientRows[0]?.name ?? "Client"} opened the upload link`,
      created_at: now,
    })
  );
}

export async function createRequest(input: {
  clientId: string;
  label: string;
  description: string | null;
  documentNames: string[];
}): Promise<DocumentRequest> {
  const sb = getSupabase();

  const clientRows = unwrap<{ name: string }[]>(
    await sb.from("cc_clients").select("name").eq("id", input.clientId).limit(1)
  );
  const client = clientRows[0];
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
  unwrap(await sb.from("cc_document_requests").insert(request));

  const requiredRows = input.documentNames.map((name, idx) => ({
    id: newId("rd"),
    request_id: request.id,
    name: name.trim(),
    sort_order: idx,
  }));
  unwrap(await sb.from("cc_required_documents").insert(requiredRows));

  unwrap(
    await sb.from("cc_activity_logs").insert({
      id: newId("act"),
      org_id: request.org_id,
      client_id: input.clientId,
      request_id: request.id,
      type: "request_created",
      message: `${request.label} request created for ${client.name}`,
      created_at: request.created_at,
    })
  );

  return request;
}

export async function sendReminder(requestId: string): Promise<void> {
  const sb = getSupabase();
  const rows = unwrap<DocumentRequest[]>(
    await sb.from("cc_document_requests").select("*").eq("id", requestId).limit(1)
  );
  const request = rows[0];
  if (!request) return;

  const clientRows = unwrap<{ name: string }[]>(
    await sb.from("cc_clients").select("name").eq("id", request.client_id).limit(1)
  );

  unwrap(
    await sb.from("cc_activity_logs").insert({
      id: newId("act"),
      org_id: request.org_id,
      client_id: request.client_id,
      request_id: request.id,
      type: "reminder_sent",
      message: `Reminder sent to ${clientRows[0]?.name ?? "client"} for ${request.label}`,
      created_at: new Date().toISOString(),
    })
  );
}

// ---------- uploads ----------

export async function uploadDocument(input: {
  requiredDocumentId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}): Promise<void> {
  const sb = getSupabase();

  const rdRows = unwrap<RequiredDocument[]>(
    await sb.from("cc_required_documents").select("*").eq("id", input.requiredDocumentId).limit(1)
  );
  const rd = rdRows[0];
  if (!rd) throw new Error("Required document not found");

  const requestRows = unwrap<DocumentRequest[]>(
    await sb.from("cc_document_requests").select("*").eq("id", rd.request_id).limit(1)
  );
  const request = requestRows[0];
  if (!request) throw new Error("Request not found");

  const clientRows = unwrap<{ name: string }[]>(
    await sb.from("cc_clients").select("name").eq("id", request.client_id).limit(1)
  );
  const clientName = clientRows[0]?.name ?? "Client";

  const previousRows = unwrap<UploadedDocument[]>(
    await sb
      .from("cc_uploaded_documents")
      .select("*")
      .eq("required_document_id", rd.id)
      .eq("is_current", true)
      .limit(1)
  );
  const previous = previousRows[0] ?? null;
  const isReplace = Boolean(previous);
  const nextVersion = previous ? previous.version + 1 : 1;

  const key = `${rd.request_id}/${rd.id}/${newId("up")}-${input.fileName}`;
  const storageKey = await storage.put({ key, buffer: input.buffer, mimeType: input.mimeType });

  if (previous) {
    unwrap(await sb.from("cc_uploaded_documents").update({ is_current: false }).eq("id", previous.id));
  }

  const now = new Date().toISOString();
  unwrap(
    await sb.from("cc_uploaded_documents").insert({
      id: newId("ud"),
      required_document_id: rd.id,
      file_name: input.fileName,
      storage_key: storageKey,
      mime_type: input.mimeType,
      size_bytes: input.buffer.byteLength,
      version: nextVersion,
      is_current: true,
      uploaded_at: now,
    })
  );

  unwrap(
    await sb.from("cc_activity_logs").insert({
      id: newId("act"),
      org_id: request.org_id,
      client_id: request.client_id,
      request_id: request.id,
      type: isReplace ? "document_replaced" : "document_uploaded",
      message: `${clientName} ${isReplace ? "replaced" : "uploaded"} ${input.fileName}`,
      created_at: now,
    })
  );

  // recompute completion
  const allRds = unwrap<{ id: string }[]>(
    await sb.from("cc_required_documents").select("id").eq("request_id", request.id)
  );
  const currentUploads = unwrap<{ required_document_id: string }[]>(
    await sb
      .from("cc_uploaded_documents")
      .select("required_document_id")
      .in(
        "required_document_id",
        allRds.map((d) => d.id)
      )
      .eq("is_current", true)
  );
  const currentSet = new Set(currentUploads.map((u) => u.required_document_id));
  const allCurrent = allRds.length > 0 && allRds.every((d) => currentSet.has(d.id));

  if (allCurrent && request.status !== "complete") {
    const completedAt = new Date().toISOString();
    unwrap(
      await sb
        .from("cc_document_requests")
        .update({ status: "complete", completed_at: completedAt })
        .eq("id", request.id)
    );
    unwrap(
      await sb.from("cc_activity_logs").insert({
        id: newId("act"),
        org_id: request.org_id,
        client_id: request.client_id,
        request_id: request.id,
        type: "request_completed",
        message: `${clientName} completed the ${request.label} request`,
        created_at: completedAt,
      })
    );
  } else if (!allCurrent && request.status === "complete") {
    unwrap(
      await sb
        .from("cc_document_requests")
        .update({ status: "pending", completed_at: null })
        .eq("id", request.id)
    );
  }
}

export async function removeDocument(requiredDocumentId: string): Promise<void> {
  const sb = getSupabase();

  const currentRows = unwrap<UploadedDocument[]>(
    await sb
      .from("cc_uploaded_documents")
      .select("*")
      .eq("required_document_id", requiredDocumentId)
      .eq("is_current", true)
      .limit(1)
  );
  const current = currentRows[0];
  if (!current) return;

  await storage.remove(current.storage_key);
  unwrap(await sb.from("cc_uploaded_documents").update({ is_current: false }).eq("id", current.id));

  const rdRows = unwrap<RequiredDocument[]>(
    await sb.from("cc_required_documents").select("*").eq("id", requiredDocumentId).limit(1)
  );
  const rd = rdRows[0];
  if (!rd) return;

  const requestRows = unwrap<DocumentRequest[]>(
    await sb.from("cc_document_requests").select("*").eq("id", rd.request_id).limit(1)
  );
  const request = requestRows[0];
  if (!request) return;

  const clientRows = unwrap<{ name: string }[]>(
    await sb.from("cc_clients").select("name").eq("id", request.client_id).limit(1)
  );

  if (request.status === "complete") {
    unwrap(
      await sb
        .from("cc_document_requests")
        .update({ status: "pending", completed_at: null })
        .eq("id", request.id)
    );
  }

  unwrap(
    await sb.from("cc_activity_logs").insert({
      id: newId("act"),
      org_id: request.org_id,
      client_id: request.client_id,
      request_id: request.id,
      type: "document_removed",
      message: `${clientRows[0]?.name ?? "Client"} removed ${current.file_name}`,
      created_at: new Date().toISOString(),
    })
  );
}

export async function getDocumentUrl(uploadedDocumentId: string): Promise<string | null> {
  const sb = getSupabase();
  const rows = unwrap<{ storage_key: string }[]>(
    await sb.from("cc_uploaded_documents").select("storage_key").eq("id", uploadedDocumentId).limit(1)
  );
  const doc = rows[0];
  if (!doc) return null;
  return storage.signedGetUrl(doc.storage_key);
}

// ---------- activity ----------

export async function listActivity(): Promise<ActivityLog[]> {
  const sb = getSupabase();
  return unwrap<ActivityLog[]>(
    await sb
      .from("cc_activity_logs")
      .select("*")
      .eq("org_id", getCurrentOrgId())
      .order("created_at", { ascending: false })
  );
}

// ---------- dashboard ----------

export async function getDashboardStats() {
  const sb = getSupabase();
  const orgId = getCurrentOrgId();

  const { count: totalClients } = await sb
    .from("cc_clients")
    .select("id", { count: "exact", head: true })
    .eq("org_id", orgId);

  const pendingRequests = unwrap<DocumentRequest[]>(
    await sb.from("cc_document_requests").select("*").eq("org_id", orgId).eq("status", "pending")
  );
  const requiredMap = await fetchRequiredWithCurrent(pendingRequests.map((r) => r.id));

  let documentsAwaiting = 0;
  for (const r of pendingRequests) {
    const wd = toRequestWithDocs(r, requiredMap);
    documentsAwaiting += wd.total_count - wd.received_count;
  }

  return {
    totalClients: totalClients ?? 0,
    pendingRequests: pendingRequests.length,
    documentsAwaiting,
  };
}

// ---------- demo reset ----------

export async function resetSupabaseData(): Promise<void> {
  const sb = getSupabase();
  // cascades to clients/requests/required_documents/uploaded_documents/activity_logs
  await sb.from("cc_organizations").delete().eq("id", getCurrentOrgId());

  const seed = await buildSupabaseSeed();
  unwrap(await sb.from("cc_organizations").insert(seed.organizations));
  unwrap(await sb.from("cc_clients").insert(seed.clients));
  unwrap(await sb.from("cc_document_requests").insert(seed.document_requests));
  unwrap(await sb.from("cc_required_documents").insert(seed.required_documents));
  if (seed.uploaded_documents.length > 0) {
    unwrap(await sb.from("cc_uploaded_documents").insert(seed.uploaded_documents));
  }
  unwrap(await sb.from("cc_activity_logs").insert(seed.activity_logs));
}
