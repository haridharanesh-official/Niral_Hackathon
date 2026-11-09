import { apiOrigin } from '@/lib/api-origin';
import { NextResponse } from 'next/server';
import { getContentStore } from '@/lib/content-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const apiUrl = apiOrigin();

  let authoritativeEvent: any = null;

  try {
    if (!apiUrl) throw Error('The event API is not configured.');
    const res = await fetch(`${apiUrl}/api/events/current`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      authoritativeEvent = await res.json();
    }
  } catch (err) {
    console.warn(
      'Failed to reach backend /api/events/current, falling back to local store:',
      err,
    );
  }

  const fallback = getContentStore().event;
  const now = Date.now();

  if (authoritativeEvent) {
    const starts = new Date(authoritativeEvent.startsAt).getTime();
    return NextResponse.json({
      id: authoritativeEvent.id,
      name: authoritativeEvent.name,
      logo: authoritativeEvent.logoUrl || fallback.logo,
      description:
        authoritativeEvent.publicDescription ||
        authoritativeEvent.description ||
        fallback.description,
      tagline: authoritativeEvent.tagline || fallback.tagline,
      venue: authoritativeEvent.venueName || 'Venue to be announced',
      startsAt: authoritativeEvent.startsAt,
      endsAt: authoritativeEvent.endsAt,
      registrationDeadline:
        authoritativeEvent.registrationEndsAt || fallback.registrationDeadline,
      capacity: authoritativeEvent.maxCapacity || 0,
      filled: 0,
      registrationStatus:
        authoritativeEvent.registrationEnabled &&
        authoritativeEvent.registrationPaymentMode !== 'DISABLED' &&
        authoritativeEvent.status === 'REGISTRATION_OPEN' &&
        (!authoritativeEvent.registrationStartsAt ||
          new Date(authoritativeEvent.registrationStartsAt).getTime() <= now) &&
        (!authoritativeEvent.registrationEndsAt ||
          new Date(authoritativeEvent.registrationEndsAt).getTime() >= now)
          ? 'open'
          : 'closed',
      prizePool: authoritativeEvent.prizePool || 0,
      hasExactTimes: authoritativeEvent.hasExactTimes ?? false,
      timezone: authoritativeEvent.timezone || 'Asia/Kolkata',
      serverNow: new Date(now).toISOString(),
      countdownMs: Math.max(0, starts - now),
    });
  }

  const starts = new Date(fallback.startsAt).getTime();
  return NextResponse.json({
    ...fallback,
    registrationStatus: 'closed',
    serverNow: new Date(now).toISOString(),
    countdownMs: Math.max(0, starts - now),
  });
}
