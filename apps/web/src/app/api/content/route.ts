import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getContentStore, updateContentStore, resetContentStore } from '@/lib/content-store';

export const dynamic = 'force-dynamic';
async function authorize(req?: NextRequest) {
  if (req && req.headers.get('origin') !== req.nextUrl.origin)
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Administrator required' }, { status: 403 });
}
export async function GET() {
  const denied = await authorize();
  if (denied) return denied;
  return NextResponse.json(getContentStore());
}
export async function PUT(req: NextRequest) {
  const denied = await authorize(req);
  if (denied) return denied;
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return NextResponse.json({ error: 'Expected a content object' }, { status: 400 });
    return NextResponse.json({ ok: true, data: updateContentStore(body) });
  } catch {
    return NextResponse.json({ error: 'Failed to update content' }, { status: 400 });
  }
}
export async function POST(req: NextRequest) {
  const denied = await authorize(req);
  if (denied) return denied;
  try {
    const body: unknown = await req.json();
    if (!body || typeof body !== 'object' || Array.isArray(body))
      return NextResponse.json({ error: 'Expected a content object' }, { status: 400 });
    const data = 'action' in body && body.action === 'reset' ? resetContentStore() : updateContentStore(body);
    return NextResponse.json({ ok: true, data });
  } catch {
    return NextResponse.json({ error: 'Failed to process request' }, { status: 400 });
  }
}
