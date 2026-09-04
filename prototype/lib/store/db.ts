import fs from "node:fs";
import path from "node:path";
import type { DB } from "@/lib/types";
import { buildSeed } from "@/lib/store/seed";

/**
 * Minimal JSON-file-backed store standing in for Postgres. Every function
 * below is written the shape a real DB client would have (get/list/insert)
 * so swapping this module out for a Supabase client later doesn't change
 * any call site — see PLAN.md §6.
 *
 * Not safe for concurrent multi-process writes. Fine for a local prototype
 * demo; not fine for production.
 */

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function ensureDb(): void {
  if (!fs.existsSync(DB_PATH)) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    writeDb(buildSeed());
  }
}

export function readDb(): DB {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  return JSON.parse(raw) as DB;
}

export function writeDb(db: DB): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
}

export function resetDb(): DB {
  const fresh = buildSeed();
  writeDb(fresh);
  return fresh;
}

/** Convenience for read-modify-write call sites. */
export function mutateDb<T>(fn: (db: DB) => T): T {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return result;
}
