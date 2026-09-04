import type { StorageAdapter } from "@/lib/storage";
import { getSupabase, DOCUMENTS_BUCKET } from "@/lib/supabase/client";

const SIGNED_URL_TTL_SECONDS = 60;

export class SupabaseStorage implements StorageAdapter {
  async put({
    key,
    buffer,
    mimeType,
  }: {
    key: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<string> {
    const { error } = await getSupabase()
      .storage.from(DOCUMENTS_BUCKET)
      .upload(key, buffer, { contentType: mimeType, upsert: true });
    if (error) throw error;
    return key;
  }

  async signedGetUrl(storageKey: string): Promise<string> {
    const { data, error } = await getSupabase()
      .storage.from(DOCUMENTS_BUCKET)
      .createSignedUrl(storageKey, SIGNED_URL_TTL_SECONDS);
    if (error || !data) throw error ?? new Error("Could not sign URL");
    return data.signedUrl;
  }

  async remove(storageKey: string): Promise<void> {
    const { error } = await getSupabase().storage.from(DOCUMENTS_BUCKET).remove([storageKey]);
    if (error) throw error;
  }
}

/** Recursively empties the documents bucket — used only by the demo reset action. */
export async function clearDocumentsBucket(): Promise<void> {
  const bucket = getSupabase().storage.from(DOCUMENTS_BUCKET);

  async function listFilesRecursive(prefix: string): Promise<string[]> {
    const { data, error } = await bucket.list(prefix, { limit: 1000 });
    if (error || !data) return [];
    const files: string[] = [];
    for (const entry of data) {
      const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.id === null) {
        files.push(...(await listFilesRecursive(fullPath)));
      } else {
        files.push(fullPath);
      }
    }
    return files;
  }

  const allFiles = await listFilesRecursive("");
  if (allFiles.length === 0) return;
  // storage remove() accepts at most a reasonable batch size; chunk to be safe
  for (let i = 0; i < allFiles.length; i += 100) {
    await bucket.remove(allFiles.slice(i, i + 100));
  }
}
