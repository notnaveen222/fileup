import { NextRequest, NextResponse } from "next/server";
import { sendReminder } from "@/lib/store/queries";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await sendReminder(id);
  return NextResponse.json({ ok: true });
}
