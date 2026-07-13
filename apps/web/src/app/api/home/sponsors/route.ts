import { NextResponse } from "next/server";
import { homeSponsorsSeed } from "@/services/home/seed";

export async function GET() {
  return NextResponse.json(homeSponsorsSeed);
}
