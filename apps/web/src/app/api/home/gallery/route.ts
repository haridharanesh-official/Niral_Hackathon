import { NextResponse } from "next/server";
import { homeGallerySeed } from "@/services/home/seed";

export async function GET() {
  return NextResponse.json(homeGallerySeed);
}
