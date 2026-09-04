import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/store/queries";

export async function GET() {
  return NextResponse.json(await getDashboardStats());
}
