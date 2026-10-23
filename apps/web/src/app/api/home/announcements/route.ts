import { NextResponse } from "next/server";
import { getContentStore } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const announcements = getContentStore().announcements;
  const now = Date.now();
  const items = announcements.filter((a) => {
    if (!a.expiresAt) return true;
    return new Date(a.expiresAt).getTime() > now;
  });
  return NextResponse.json(items);
}
