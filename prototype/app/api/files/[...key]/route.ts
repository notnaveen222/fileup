import fs from "node:fs";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { verifyKey } from "@/lib/storage/sign";
import { ALLOWED_UPLOAD_TYPES } from "@/lib/uploads";

const ROOT = path.join(process.cwd(), "data", "uploads");

const MIME_BY_EXT: Record<string, string> = Object.fromEntries(
  ALLOWED_UPLOAD_TYPES.flatMap((t) => t.ext.split(",").map((ext) => [ext, t.mime]))
);

/**
 * Stands in for a cloud provider's signed-URL redirect. The key is never
 * public: this route only serves the file if the exp/sig query params
 * verify, matching the shape a real Supabase Storage / R2 signed URL has.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: keyParts } = await params;
  const key = keyParts.join("/");

  const exp = Number(req.nextUrl.searchParams.get("exp"));
  const sig = req.nextUrl.searchParams.get("sig") ?? "";

  if (!verifyKey(key, exp, sig)) {
    return NextResponse.json({ error: "Link expired" }, { status: 403 });
  }

  const fullPath = path.join(ROOT, key);
  if (!fullPath.startsWith(ROOT) || !fs.existsSync(fullPath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(fullPath).toLowerCase();
  const mime = MIME_BY_EXT[ext] ?? "application/octet-stream";
  const buffer = fs.readFileSync(fullPath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mime,
      "Content-Disposition": `inline; filename="${path.basename(fullPath)}"`,
      "Cache-Control": "private, max-age=0, no-store",
    },
  });
}
