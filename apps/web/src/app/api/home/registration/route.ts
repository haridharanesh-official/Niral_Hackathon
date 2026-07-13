import { NextResponse } from "next/server";
import { homeEventSeed, toRegistrationProgress } from "@/services/home/seed";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(toRegistrationProgress(homeEventSeed));
}
