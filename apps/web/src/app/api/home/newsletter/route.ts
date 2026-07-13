import { NextRequest, NextResponse } from "next/server";
import type { NewsletterPayload } from "@/types/home";

const subscribed = new Set<string>();
const recent = new Map<string, number>();

function clientKey(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "local"
  );
}

export async function POST(req: NextRequest) {
  const ip = clientKey(req);
  const now = Date.now();
  const last = recent.get(ip) ?? 0;
  if (now - last < 4000) {
    return NextResponse.json(
      { ok: false, message: "Too many requests. Please wait a moment." },
      { status: 429 },
    );
  }
  recent.set(ip, now);

  let body: NewsletterPayload;
  try {
    body = (await req.json()) as NewsletterPayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const email = body.email?.trim().toLowerCase() ?? "";
  if (!body.name?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { ok: false, message: "Valid name and email are required." },
      { status: 400 },
    );
  }
  if (!body.consent) {
    return NextResponse.json(
      { ok: false, message: "Consent is required." },
      { status: 400 },
    );
  }
  if (subscribed.has(email)) {
    return NextResponse.json(
      { ok: false, message: "This email is already subscribed." },
      { status: 409 },
    );
  }

  subscribed.add(email);
  return NextResponse.json({
    ok: true,
    message: `Confirmation queued for ${email}.`,
  });
}
