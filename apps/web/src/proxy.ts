import { auth } from '@/auth';
import { NextResponse } from 'next/server';
export const proxy = auth((request) => {
  const path = request.nextUrl.pathname;
  if (!request.auth?.user) {
    const hadSession = request.cookies.getAll().some(cookie => /(?:authjs|next-auth)\.session-token/.test(cookie.name));
    return NextResponse.redirect(new URL(hadSession ? '/session-expired' : '/login', request.url));
  }
  const role = request.auth.user.role;
  const restricted: [string, string[]][] = [
    ['/dashboard/judge', ['JUDGE', 'ADMIN']],
    ['/dashboard/volunteer', ['VOLUNTEER', 'ADMIN']],
    ['/dashboard/organizer', ['ORGANIZER', 'ADMIN']],
    ['/dashboard/mentor', ['MENTOR', 'ADMIN']],
    ['/dashboard/sponsor', ['SPONSOR', 'ADMIN']],
    ['/admin/event-settings', ['ORGANIZER', 'ADMIN']],
    ['/admin', ['ADMIN']],
  ];
  const rule = restricted.find(
    ([prefix]) => path === prefix || path.startsWith(prefix + '/'),
  );
  if (rule && !rule[1].includes(role))
    return NextResponse.redirect(new URL('/dashboard', request.url));
  return NextResponse.next();
});
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/apply',
    '/volunteer',
    '/judge',
    '/organizer',
    '/master',
  ],
};
