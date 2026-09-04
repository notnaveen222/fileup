import fs from "node:fs";
import path from "node:path";
import type { StorageAdapter } from "@/lib/storage";
import { signKey } from "@/lib/storage/sign";

const ROOT = path.join(process.cwd(), "data", "uploads");

export class LocalDiskStorage implements StorageAdapter {
  async put({
    key,
    buffer,
  }: {
    key: string;
    buffer: Buffer;
    mimeType: string;
  }): Promise<string> {
    const fullPath = path.join(ROOT, key);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, buffer);
    return key;
  }

  async signedGetUrl(storageKey: string): Promise<string> {
    const { exp, sig } = signKey(storageKey);
    const encoded = encodeURIComponent(storageKey);
    return `/api/files/${encoded}?exp=${exp}&sig=${sig}`;
  }

  async remove(storageKey: string): Promise<void> {
    const fullPath = path.join(ROOT, storageKey);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
}
