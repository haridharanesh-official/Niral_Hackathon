/** Deployment identity is configuration, never a request Host header. */
export function siteOrigin(env: Record<string, string | undefined> = process.env) {
  const preview = env.VERCEL_ENV === 'preview';
  const raw = preview
    ? env.VERCEL_URL && `https://${env.VERCEL_URL}`
    : (env.NEXT_PUBLIC_SITE_URL ??
      env.AUTH_URL ??
      env.NEXTAUTH_URL ??
      'https://niralhackathon.dpdns.org');
  if (!raw) throw new Error('A preview deployment URL is required.');
  const url = new URL(raw);
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/' ||
    (url.protocol !== 'https:' &&
      !(
        env.NODE_ENV !== 'production' &&
        url.protocol === 'http:' &&
        ['localhost', '127.0.0.1'].includes(url.hostname)
      ))
  ) {
    throw new Error('Configure a valid site origin.');
  }
  return url.origin;
}
