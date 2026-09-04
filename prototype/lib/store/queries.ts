import { isSupabaseConfigured } from "@/lib/supabase/client";
import * as jsonImpl from "@/lib/store/json-queries";
import * as supabaseImpl from "@/lib/store/supabase-queries";

/**
 * Repository layer — pages/API routes import from here only, never from
 * json-queries.ts or supabase-queries.ts directly. Which backend is live is
 * decided once, by whether Supabase env vars are present (see
 * lib/supabase/client.ts). Every export here is async regardless of which
 * backend is active, so call sites don't need to know or care which one
 * they're talking to. See PLAN.md §6.
 */

const impl = isSupabaseConfigured() ? supabaseImpl : jsonImpl;

export async function getCurrentOrgId() {
  return impl.getCurrentOrgId();
}

export async function listClients() {
  return impl.listClients();
}

export async function getClient(clientId: string) {
  return impl.getClient(clientId);
}

export async function createClient(input: { name: string; email: string; phone: string }) {
  return impl.createClient(input);
}

export async function listRequests() {
  return impl.listRequests();
}

export async function getRequest(requestId: string) {
  return impl.getRequest(requestId);
}

export async function getRequestByToken(token: string) {
  return impl.getRequestByToken(token);
}

export async function markLinkOpened(token: string) {
  return impl.markLinkOpened(token);
}

export async function createRequest(input: {
  clientId: string;
  label: string;
  description: string | null;
  documentNames: string[];
}) {
  return impl.createRequest(input);
}

export async function sendReminder(requestId: string) {
  return impl.sendReminder(requestId);
}

export async function uploadDocument(input: {
  requiredDocumentId: string;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}) {
  return impl.uploadDocument(input);
}

export async function removeDocument(requiredDocumentId: string) {
  return impl.removeDocument(requiredDocumentId);
}

export async function getDocumentUrl(uploadedDocumentId: string) {
  return impl.getDocumentUrl(uploadedDocumentId);
}

export async function listActivity() {
  return impl.listActivity();
}

export async function getDashboardStats() {
  return impl.getDashboardStats();
}
