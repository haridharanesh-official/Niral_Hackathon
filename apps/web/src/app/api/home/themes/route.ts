import { NextResponse } from "next/server";
import { homeThemesSeed } from "@/services/home/seed";

export async function GET() {
  return NextResponse.json(homeThemesSeed.filter((t) => t.status === "active"));
}
