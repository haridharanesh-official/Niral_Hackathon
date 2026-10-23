import { NextRequest, NextResponse } from "next/server";
import { getContentStore, updateContentStore, resetContentStore } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = getContentStore();
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = updateContentStore(body);
    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to update content" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.action === "reset") {
      const reset = resetContentStore();
      return NextResponse.json({ ok: true, data: reset });
    }
    const updated = updateContentStore(body);
    return NextResponse.json({ ok: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to process request" }, { status: 400 });
  }
}
