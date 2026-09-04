import { NextRequest, NextResponse } from "next/server";
import { createClient, listClients } from "@/lib/store/queries";

export async function GET() {
  return NextResponse.json(await listClients());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, email, phone } = body ?? {};

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const client = await createClient({
    name,
    email: email ?? "",
    phone: phone ?? "",
  });

  return NextResponse.json(client, { status: 201 });
}
