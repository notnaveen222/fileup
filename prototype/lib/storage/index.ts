/**
 * Storage abstraction — see PLAN.md §6. The app only ever talks to this
 * interface, never to the filesystem or a specific provider directly.
 * Swapping to Supabase Storage or R2 later means writing one new class
 * here and changing the single export at the bottom of this file.
 */
export interface StorageAdapter {
  /** Persists a file, returns an opaque storage key (not a URL). */
  put(params: {
    key: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<string>;

  /** Returns a short-lived URL to fetch the file — never a public/permanent one. */
  signedGetUrl(storageKey: string): Promise<string>;

  remove(storageKey: string): Promise<void>;
}

import { LocalDiskStorage } from "@/lib/storage/local";
import { SupabaseStorage } from "@/lib/storage/supabase";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export const storage: StorageAdapter = isSupabaseConfigured()
  ? new SupabaseStorage()
  : new LocalDiskStorage();
