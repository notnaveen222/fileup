import { NextResponse } from "next/server";
import { listActivity } from "@/lib/store/queries";

export async function GET() {
  return NextResponse.json(await listActivity());
}
