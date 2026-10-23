import { NextRequest, NextResponse } from "next/server";
import { getContentStore } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const tab = req.nextUrl.searchParams.get("tab") ?? "overall";
  const leaderboard = getContentStore().leaderboard;
  const rows = leaderboard.map((row, index) => ({
    ...row,
    xp: row.xp + (tab === "quiz" ? -index * 12 : index % 3),
  }));
  return NextResponse.json(rows.slice(0, 10));
}
