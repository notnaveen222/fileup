import { NextRequest, NextResponse } from "next/server";
import { removeDocument, uploadDocument } from "@/lib/store/queries";
import { ALLOWED_UPLOAD_MIME_TYPES, UPLOAD_REJECTION_MESSAGE } from "@/lib/uploads";

const MAX_BYTES = 15 * 1024 * 1024; // 15MB — generous for a phone photo of a document

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ requiredDocumentId: string }> }
) {
  const { requiredDocumentId } = await params;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "File is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is too large (max 15MB)" }, { status: 400 });
  }
  if (file.type && !ALLOWED_UPLOAD_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ error: UPLOAD_REJECTION_MESSAGE }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let document;
  try {
    document = await uploadDocument({
      requiredDocumentId,
      fileName: file.name || "document",
      mimeType: file.type || "application/octet-stream",
      buffer,
    });
  } catch (err) {
    console.error("upload failed", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, document });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ requiredDocumentId: string }> }
) {
  const { requiredDocumentId } = await params;
  await removeDocument(requiredDocumentId);
  return NextResponse.json({ ok: true });
}
