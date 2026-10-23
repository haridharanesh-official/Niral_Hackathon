import { NextResponse } from "next/server";
import { getContentStore } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = getContentStore().statistics;
  // Return authoritative stored statistics without synthetic variance or fabricated numbers
  return NextResponse.json(stats);
}
