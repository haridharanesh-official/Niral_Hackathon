import { NextResponse } from "next/server";
import { homeTestimonialsSeed } from "@/services/home/seed";

export async function GET() {
  return NextResponse.json(homeTestimonialsSeed);
}
