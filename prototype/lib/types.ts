/**
 * Entity shapes mirror the intended Postgres schema (see PLAN.md §6) so the
 * JSON-backed store in lib/store/ can be swapped for a real Supabase client
 * later without touching call sites or these types.
 */

export type ID = string;

export interface Organization {
  id: ID;
  name: string;
  created_at: string;
}

export interface Client {
  id: ID;
  org_id: ID;
  name: string;
  email: string;
  phone: string;
  created_at: string;
}

export type RequestStatus = "pending" | "complete";

/** A "collection run" — one checklist + one link, for one client. */
export interface DocumentRequest {
  id: ID;
  org_id: ID;
  client_id: ID;
  label: string;
  description: string | null;
  token: string;
  status: RequestStatus;
  created_at: string;
  first_opened_at: string | null;
  completed_at: string | null;
}

export interface RequiredDocument {
  id: ID;
  request_id: ID;
  name: string;
  sort_order: number;
}

export interface UploadedDocument {
  id: ID;
  required_document_id: ID;
  file_name: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  version: number;
  is_current: boolean;
  uploaded_at: string;
}

export type ActivityType =
  | "client_created"
  | "request_created"
  | "link_opened"
  | "document_uploaded"
  | "document_replaced"
  | "document_removed"
  | "request_completed"
  | "reminder_sent";

export interface ActivityLog {
  id: ID;
  org_id: ID;
  client_id: ID | null;
  request_id: ID | null;
  type: ActivityType;
  message: string;
  created_at: string;
}

/** Whole on-disk database shape. */
export interface DB {
  organizations: Organization[];
  clients: Client[];
  document_requests: DocumentRequest[];
  required_documents: RequiredDocument[];
  uploaded_documents: UploadedDocument[];
  activity_logs: ActivityLog[];
}

/** Derived, UI-facing shapes — computed, never stored. */

/** What uploadDocument() returns — just enough for the client to update its
 * state optimistically without re-fetching the whole request. */
export interface UploadedDocSummary {
  id: ID;
  file_name: string;
  size_bytes: number;
  url: string | null;
}

export interface RequestWithDocs extends DocumentRequest {
  required: (RequiredDocument & { current: UploadedDocument | null })[];
  received_count: number;
  total_count: number;
}

export interface ClientWithProgress extends Client {
  runs: DocumentRequest[];
  received_count: number;
  total_count: number;
  status: RequestStatus | "mixed" | "none";
  last_activity_at: string | null;
}
