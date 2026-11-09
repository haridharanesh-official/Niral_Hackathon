// Server-only origin normalization. Callers append /api exactly once.
export function apiOrigin() {
  const raw =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:4000' : '');
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.username || url.password || url.search || url.hash) return null;
    url.pathname = url.pathname.replace(/\/+$/, '').replace(/\/api$/, '');
    if (url.pathname && url.pathname !== '/') return null;
    if (
      process.env.NODE_ENV === 'production' &&
      (url.protocol !== 'https:' ||
        ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    )
      return null;
    const web =
      process.env.AUTH_URL ??
      process.env.NEXTAUTH_URL ??
      process.env.NEXT_PUBLIC_SITE_URL;
    if (web && new URL(web).origin === url.origin) return null;
    return url.origin;
  } catch {
    return null;
  }
}
