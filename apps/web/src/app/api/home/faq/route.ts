import { NextResponse } from "next/server";
import { homeFaqSeed } from "@/services/home/seed";

export async function GET() {
  return NextResponse.json(homeFaqSeed);
}
