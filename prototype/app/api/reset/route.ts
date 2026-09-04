import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { resetDb } from "@/lib/store/db";
import { resetSupabaseData } from "@/lib/store/supabase-queries";
import { clearDocumentsBucket } from "@/lib/storage/supabase";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const UPLOADS_ROOT = path.join(process.cwd(), "data", "uploads");

export async function POST() {
  if (isSupabaseConfigured()) {
    await clearDocumentsBucket();
    await resetSupabaseData();
  } else {
    resetDb();
    if (fs.existsSync(UPLOADS_ROOT)) {
      fs.rmSync(UPLOADS_ROOT, { recursive: true, force: true });
    }
  }
  return NextResponse.json({ ok: true });
}
