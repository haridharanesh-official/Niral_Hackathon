import { NextResponse } from "next/server";
import { getContentStore } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getContentStore().themes);
}
