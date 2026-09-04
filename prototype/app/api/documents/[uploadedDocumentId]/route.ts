import { NextRequest, NextResponse } from "next/server";
import { getDocumentUrl } from "@/lib/store/queries";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ uploadedDocumentId: string }> }
) {
  const { uploadedDocumentId } = await params;
  const url = await getDocumentUrl(uploadedDocumentId);
  if (!url) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ url });
}
