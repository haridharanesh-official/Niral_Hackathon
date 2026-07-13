import { NextResponse } from "next/server";
import { homeEventSeed } from "@/services/home/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  const starts = new Date(homeEventSeed.startsAt).getTime();
  return NextResponse.json({
    ...homeEventSeed,
    serverNow: new Date(now).toISOString(),
    countdownMs: Math.max(0, starts - now),
  });
}
