import { NextRequest, NextResponse } from "next/server";
import { homeLeaderboardSeed } from "@/services/home/seed";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab") ?? "overall";
  const rows = homeLeaderboardSeed.map((row, index) => ({
    ...row,
    xp: row.xp + (tab === "quiz" ? -index * 12 : index % 3),
  }));
  return NextResponse.json(rows.slice(0, 10));
}
