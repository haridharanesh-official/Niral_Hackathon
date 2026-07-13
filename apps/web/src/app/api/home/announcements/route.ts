import { NextResponse } from "next/server";
import { homeAnnouncementsSeed } from "@/services/home/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  const items = homeAnnouncementsSeed.filter((a) => {
    if (!a.expiresAt) return true;
    return new Date(a.expiresAt).getTime() > now;
  });
  return NextResponse.json(items);
}
