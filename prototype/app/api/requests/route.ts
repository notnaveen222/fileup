import { NextRequest, NextResponse } from "next/server";
import { createRequest, listRequests } from "@/lib/store/queries";

export async function GET() {
  return NextResponse.json(await listRequests());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clientId, label, description, documentNames } = body ?? {};

  if (!clientId || typeof clientId !== "string") {
    return NextResponse.json({ error: "clientId is required" }, { status: 400 });
  }
  if (!label || typeof label !== "string" || !label.trim()) {
    return NextResponse.json({ error: "A label for this collection run is required" }, { status: 400 });
  }
  if (!Array.isArray(documentNames) || documentNames.length === 0) {
    return NextResponse.json({ error: "Select at least one document" }, { status: 400 });
  }

  const request = await createRequest({
    clientId,
    label,
    description: description ?? null,
    documentNames,
  });

  return NextResponse.json(request, { status: 201 });
}
