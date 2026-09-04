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
  UploadedDocSummary,
  UploadedDocument,
} from "@/lib/types";

/**
 * Supabase-backed implementation of the repository layer — same exported
 * function names/signatures as lib/store/json-queries.ts. lib/store/queries.ts
 * dispatches to whichever of the two is active based on env config.
 *
 * Reads use PostgREST's embedded-resource selects (one round trip walking the
 * client -> request -> required-doc -> uploaded-doc FK chain) instead of one
 * query per table, and independent queries/writes run via Promise.all. Writes
 * that are chained by a real dependency (a row must exist before a child FK
 * row can reference it, or the cc_uploaded_documents "one current per
 * required doc" partial unique index) stay sequential on purpose.
 */

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return data as T;
}

export function getCurrentOrgId(): string {
  return SUPABASE_DEFAULT_ORG_ID;
}

// ---------- shared embedded-select helpers ----------

type EmbeddedRequired = RequiredDocument & { cc_uploaded_documents: UploadedDocument[] };
type EmbeddedRequest = DocumentRequest & { cc_required_documents: EmbeddedRequired[] };
type EmbeddedClient = Client & { cc_document_requests: EmbeddedRequest[] };

const REQUIRED_WITH_UPLOADS_SELECT = "cc_required_documents(*, cc_uploaded_documents(*))";

function withCurrent(
  required: EmbeddedRequired[]
): (RequiredDocument & { current: UploadedDocument | null })[] {
  return required.map(({ cc_uploaded_documents, ...rd }) => ({
    ...rd,
    current: cc_uploaded_documents.find((u) => u.is_current) ?? null,
  }));
}

function stripRequired(request: EmbeddedRequest): DocumentRequest {
  const { cc_required_documents, ...run } = request;
  void cc_required_documents;
  return run;
}

function toRequestWithDocs(request: EmbeddedRequest): RequestWithDocs {
  const { cc_required_documents, ...rest } = request;
  const required = withCurrent(cc_required_documents);
  const received_count = required.filter((r) => r.current).length;
  return { ...rest, required, received_count, total_count: required.length };
}

function summarizeRuns(runs: EmbeddedRequest[]) {
  let received_count = 0;
  let total_count = 0;
  let hasPending = false;
  let hasComplete = false;
  for (const run of runs) {
    const wd = toRequestWithDocs(run);
    received_count += wd.received_count;
    total_count += wd.total_count;
    if (run.status === "complete") hasComplete = true;
    else hasPending = true;
  }
  const status: ClientWithProgress["status"] =
    runs.length === 0 ? "none" : hasPending && hasComplete ? "mixed" : hasPending ? "pending" : "complete";
  return { received_count, total_count, status };
}

// ---------- clients ----------

export async function listClients(): Promise<ClientWithProgress[]> {
  const sb = getSupabase();
  const orgId = getCurrentOrgId();

  const [clientsRes, activityRes] = await Promise.all([
    sb
      .from("cc_clients")
      .select(`*, cc_document_requests(*, ${REQUIRED_WITH_UPLOADS_SELECT})`)
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .order("created_at", { referencedTable: "cc_document_requests", ascending: false }),
    sb
      .from("cc_activity_logs")
      .select("client_id, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  const clients = unwrap<EmbeddedClient[]>(clientsRes);
  const activity = unwrap<{ client_id: string | null; created_at: string }[]>(activityRes);

  const lastActivityByClient = new Map<string, string>();
  for (const a of activity) {
    if (a.client_id && !lastActivityByClient.has(a.client_id)) {
      lastActivityByClient.set(a.client_id, a.created_at);
    }
  }

  return clients.map((c) => {
    const { cc_document_requests, ...client } = c;
    const runs = cc_document_requests.map(stripRequired);
    const { received_count, total_count, status } = summarizeRuns(cc_document_requests);

    return {
      ...client,
      runs,
      received_count,
      total_count,
      status,
      last_activity_at: lastActivityByClient.get(client.id) ?? null,
    };
  });
}

export async function getClient(clientId: string): Promise<ClientWithProgress | null> {
  const sb = getSupabase();

  const [clientRes, lastActivityRes] = await Promise.all([
    sb
      .from("cc_clients")
      .select(`*, cc_document_requests(*, ${REQUIRED_WITH_UPLOADS_SELECT})`)
      .eq("id", clientId)
      .order("created_at", { referencedTable: "cc_document_requests", ascending: false })
      .limit(1),
    sb
      .from("cc_activity_logs")
      .select("created_at")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const clients = unwrap<EmbeddedClient[]>(clientRes);
  const client = clients[0];
  if (!client) return null;
  const lastActivityRows = unwrap<{ created_at: string }[]>(lastActivityRes);

  const { cc_document_requests, ...rest } = client;
  const runs = cc_document_requests.map(stripRequired);
  const { received_count, total_count, status } = summarizeRuns(cc_document_requests);

  return {
    ...rest,
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

  // Sequential: cc_activity_logs.client_id has an FK on cc_clients, so the
  // client row must exist before the activity row can reference it.
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

  const res = await sb
    .from("cc_document_requests")
    .select(`*, ${REQUIRED_WITH_UPLOADS_SELECT}, cc_clients(name)`)
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });

  const requests = unwrap<(EmbeddedRequest & { cc_clients: { name: string } | null })[]>(res);

  return requests.map(({ cc_clients, ...request }) => ({
    ...toRequestWithDocs(request),
    client_name: cc_clients?.name ?? "Unknown",
  }));
}

export async function getRequest(requestId: string): Promise<RequestWithDocs | null> {
  const sb = getSupabase();
  const rows = unwrap<EmbeddedRequest[]>(
    await sb
      .from("cc_document_requests")
      .select(`*, ${REQUIRED_WITH_UPLOADS_SELECT}`)
      .eq("id", requestId)
      .limit(1)
  );
  const request = rows[0];
  if (!request) return null;
  return toRequestWithDocs(request);
}

export async function getRequestByToken(
  token: string
): Promise<(RequestWithDocs & { org_name: string; client_name: string }) | null> {
  const sb = getSupabase();
  const rows = unwrap<
    (EmbeddedRequest & { cc_organizations: { name: string } | null; cc_clients: { name: string } | null })[]
  >(
    await sb
      .from("cc_document_requests")
      .select(`*, ${REQUIRED_WITH_UPLOADS_SELECT}, cc_organizations(name), cc_clients(name)`)
      .eq("token", token)
      .limit(1)
  );
  const row = rows[0];
  if (!row) return null;
  const { cc_organizations, cc_clients, ...request } = row;

  return {
    ...toRequestWithDocs(request),
    org_name: cc_organizations?.name ?? "ClientCollect",
    client_name: cc_clients?.name ?? "",
  };
}

export async function markLinkOpened(token: string): Promise<void> {
  const sb = getSupabase();
  const rows = unwrap<(DocumentRequest & { cc_clients: { name: string } | null })[]>(
    await sb
      .from("cc_document_requests")
      .select("*, cc_clients(name)")
      .eq("token", token)
      .limit(1)
  );
  const request = rows[0];
  if (!request || request.first_opened_at) return;

  const now = new Date().toISOString();
  const clientName = request.cc_clients?.name ?? "Client";

  // Independent writes — the update and the activity insert don't reference
  // each other's result — so they run concurrently.
  const [updateRes, activityRes] = await Promise.all([
    sb.from("cc_document_requests").update({ first_opened_at: now }).eq("id", request.id),
    sb.from("cc_activity_logs").insert({
      id: newId("act"),
      org_id: request.org_id,
      client_id: request.client_id,
      request_id: request.id,
      type: "link_opened",
      message: `${clientName} opened the upload link`,
      created_at: now,
    }),
  ]);
  unwrap(updateRes);
  unwrap(activityRes);
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
  // The request row must exist before required_documents/activity_logs can
  // reference it via FK.
  unwrap(await sb.from("cc_document_requests").insert(request));

  const requiredRows = input.documentNames.map((name, idx) => ({
    id: newId("rd"),
    request_id: request.id,
    name: name.trim(),
    sort_order: idx,
  }));

  // Both only reference request.id (already committed above) and not each
  // other, so they can run concurrently.
  const [requiredRes, activityRes] = await Promise.all([
    sb.from("cc_required_documents").insert(requiredRows),
    sb.from("cc_activity_logs").insert({
      id: newId("act"),
      org_id: request.org_id,
      client_id: input.clientId,
      request_id: request.id,
      type: "request_created",
      message: `${request.label} request created for ${client.name}`,
      created_at: request.created_at,
    }),
  ]);
  unwrap(requiredRes);
  unwrap(activityRes);

  return request;
}

export async function sendReminder(requestId: string): Promise<void> {
  const sb = getSupabase();
  const rows = unwrap<(DocumentRequest & { cc_clients: { name: string } | null })[]>(
    await sb
      .from("cc_document_requests")
      .select("*, cc_clients(name)")
      .eq("id", requestId)
      .limit(1)
  );
  const request = rows[0];
  if (!request) return;

  unwrap(
    await sb.from("cc_activity_logs").insert({
      id: newId("act"),
      org_id: request.org_id,
      client_id: request.client_id,
      request_id: request.id,
      type: "reminder_sent",
      message: `Reminder sent to ${request.cc_clients?.name ?? "client"} for ${request.label}`,
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
}): Promise<UploadedDocSummary> {
  const sb = getSupabase();

  // The previous-upload lookup only needs the required-doc id we already
  // have, and the required-doc/request/client walk is one embedded query —
  // both run concurrently.
  const [rdRes, previousRes] = await Promise.all([
    sb
      .from("cc_required_documents")
      .select("*, cc_document_requests(*, cc_clients(name))")
      .eq("id", input.requiredDocumentId)
      .limit(1),
    sb
      .from("cc_uploaded_documents")
      .select("*")
      .eq("required_document_id", input.requiredDocumentId)
      .eq("is_current", true)
      .limit(1),
  ]);

  const rdRows = unwrap<
    (RequiredDocument & { cc_document_requests: (DocumentRequest & { cc_clients: { name: string } | null }) | null })[]
  >(rdRes);
  const rdRow = rdRows[0];
  if (!rdRow) throw new Error("Required document not found");
  const { cc_document_requests: requestRow, ...rd } = rdRow;
  if (!requestRow) throw new Error("Request not found");
  const { cc_clients, ...request } = requestRow;
  const clientName = cc_clients?.name ?? "Client";

  const previousRows = unwrap<UploadedDocument[]>(previousRes);
  const previous = previousRows[0] ?? null;
  const isReplace = Boolean(previous);
  const nextVersion = previous ? previous.version + 1 : 1;

  const key = `${rd.request_id}/${rd.id}/${newId("up")}-${input.fileName}`;

  // The storage upload and "unmark the previous current version" are
  // independent of each other, so they run concurrently. The unmark MUST
  // still finish before we insert the new row below: cc_uploaded_documents
  // has a partial unique index allowing only one is_current=true row per
  // required document, so inserting the new current row while the old one
  // is still marked current would violate it.
  const [storageKey] = await Promise.all([
    storage.put({ key, buffer: input.buffer, mimeType: input.mimeType }),
    previous
      ? sb
          .from("cc_uploaded_documents")
          .update({ is_current: false })
          .eq("id", previous.id)
          .then((r) => unwrap(r))
      : Promise.resolve(null),
  ]);

  const now = new Date().toISOString();
  const docId = newId("ud");

  // Signing the download URL and inserting the row are independent — both
  // only need storageKey/docId, which we already have.
  const [url] = await Promise.all([
    storage.signedGetUrl(storageKey),
    sb
      .from("cc_uploaded_documents")
      .insert({
        id: docId,
        required_document_id: rd.id,
        file_name: input.fileName,
        storage_key: storageKey,
        mime_type: input.mimeType,
        size_bytes: input.buffer.byteLength,
        version: nextVersion,
        is_current: true,
        uploaded_at: now,
      })
      .then((r) => unwrap(r)),
  ]);

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

  const activityInsert = sb.from("cc_activity_logs").insert({
    id: newId("act"),
    org_id: request.org_id,
    client_id: request.client_id,
    request_id: request.id,
    type: isReplace ? "document_replaced" : "document_uploaded",
    message: `${clientName} ${isReplace ? "replaced" : "uploaded"} ${input.fileName}`,
    created_at: now,
  });

  if (allCurrent && request.status !== "complete") {
    const completedAt = new Date().toISOString();
    const [activityRes, statusRes, completionRes] = await Promise.all([
      activityInsert,
      sb.from("cc_document_requests").update({ status: "complete", completed_at: completedAt }).eq("id", request.id),
      sb.from("cc_activity_logs").insert({
        id: newId("act"),
        org_id: request.org_id,
        client_id: request.client_id,
        request_id: request.id,
        type: "request_completed",
        message: `${clientName} completed the ${request.label} request`,
        created_at: completedAt,
      }),
    ]);
    unwrap(activityRes);
    unwrap(statusRes);
    unwrap(completionRes);
  } else if (!allCurrent && request.status === "complete") {
    const [activityRes, statusRes] = await Promise.all([
      activityInsert,
      sb.from("cc_document_requests").update({ status: "pending", completed_at: null }).eq("id", request.id),
    ]);
    unwrap(activityRes);
    unwrap(statusRes);
  } else {
    unwrap(await activityInsert);
  }

  return { id: docId, file_name: input.fileName, size_bytes: input.buffer.byteLength, url };
}

export async function removeDocument(requiredDocumentId: string): Promise<void> {
  const sb = getSupabase();

  const [currentRes, rdRes] = await Promise.all([
    sb
      .from("cc_uploaded_documents")
      .select("*")
      .eq("required_document_id", requiredDocumentId)
      .eq("is_current", true)
      .limit(1),
    sb
      .from("cc_required_documents")
      .select("*, cc_document_requests(*, cc_clients(name))")
      .eq("id", requiredDocumentId)
      .limit(1),
  ]);

  const currentRows = unwrap<UploadedDocument[]>(currentRes);
  const current = currentRows[0];
  if (!current) return;

  const rdRows = unwrap<
    (RequiredDocument & { cc_document_requests: (DocumentRequest & { cc_clients: { name: string } | null }) | null })[]
  >(rdRes);
  const requestRow = rdRows[0]?.cc_document_requests;
  if (!requestRow) return;
  const { cc_clients, ...request } = requestRow;
  const clientName = cc_clients?.name ?? "Client";

  // Removing the storage object and unmarking the row are independent.
  const [, updateRes] = await Promise.all([
    storage.remove(current.storage_key),
    sb.from("cc_uploaded_documents").update({ is_current: false }).eq("id", current.id),
  ]);
  unwrap(updateRes);

  const results = await Promise.all([
    sb.from("cc_activity_logs").insert({
      id: newId("act"),
      org_id: request.org_id,
      client_id: request.client_id,
      request_id: request.id,
      type: "document_removed",
      message: `${clientName} removed ${current.file_name}`,
      created_at: new Date().toISOString(),
    }),
    ...(request.status === "complete"
      ? [sb.from("cc_document_requests").update({ status: "pending", completed_at: null }).eq("id", request.id)]
      : []),
  ]);
  results.forEach((r) => unwrap(r));
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

  const [countRes, pendingRes] = await Promise.all([
    sb.from("cc_clients").select("id", { count: "exact", head: true }).eq("org_id", orgId),
    sb
      .from("cc_document_requests")
      .select(`*, ${REQUIRED_WITH_UPLOADS_SELECT}`)
      .eq("org_id", orgId)
      .eq("status", "pending"),
  ]);

  if (countRes.error) throw new Error(countRes.error.message);
  const pendingRequests = unwrap<EmbeddedRequest[]>(pendingRes);

  let documentsAwaiting = 0;
  for (const r of pendingRequests) {
    const wd = toRequestWithDocs(r);
    documentsAwaiting += wd.total_count - wd.received_count;
  }

  return {
    totalClients: countRes.count ?? 0,
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
