import { NextResponse } from "next/server";
import { homeStatisticsSeed } from "@/services/home/seed";

export const dynamic = "force-dynamic";

function jitter(base: number, variance: number) {
  return Math.max(0, base + Math.round((Math.random() * 2 - 1) * variance));
}

export async function GET() {
  return NextResponse.json({
    ...homeStatisticsSeed,
    currentlyOnline: jitter(homeStatisticsSeed.currentlyOnline, 24),
    liveTeams: jitter(homeStatisticsSeed.liveTeams, 8),
    visitors: jitter(homeStatisticsSeed.visitors, 40),
  });
}
