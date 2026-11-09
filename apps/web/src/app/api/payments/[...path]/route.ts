import { auth } from '@/auth';
import { apiOrigin } from '@/lib/api-origin';

async function proxy(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const parts = (await context.params).path;
  if (parts.some((part) => !/^[a-zA-Z0-9_-]+$/.test(part)))
    return Response.json({ message: 'Invalid request path.' }, { status: 400 });
  const path = parts.join('/');
  const allowed: Record<string, RegExp> = {
    GET: /^(config|me|upi\/[\w-]+|orders\/[\w-]+\/status|[\w-]+\/receipt|master\/upi(?:\/gmail\/status)?|master\/payments(?:\/summary)?|master\/event\/[\w-]+)$/,
    POST: /^(orders|orders\/[\w-]+\/refresh|upi\/[\w-]+\/(checkout|claim)|master\/upi\/(search|export|gmail\/(connect|complete|poll)|gmail\/[\w-]+\/(disconnect|health|labels)|[\w-]+\/(verify|reject|refunds(?:\/complete)?)))$/,
    PATCH: /^master\/(events\/[\w-]+\/payment-settings|event\/[\w-]+)$/,
  };
  if (!allowed[request.method]?.test(path))
    return Response.json({ message: 'Not found.' }, { status: 404 });
  if (
    request.method !== 'GET' &&
    request.headers.get('origin') !== new URL(request.url).origin
  )
    return Response.json({ message: 'Invalid request origin.' }, { status: 403 });
  const session = await auth();
  if (path !== 'config' && !session?.accessToken)
    return Response.json({ message: 'Sign in to continue.' }, { status: 401 });
  if (path.startsWith('master/') && session?.user.role !== 'ADMIN')
    return Response.json({ message: 'Master access required.' }, { status: 403 });
  const backend = apiOrigin();
  if (!backend)
    return Response.json(
      { message: 'The account and payment service is not configured.' },
      { status: 503 },
    );
  const target = path.startsWith('master/event/')
    ? `events/admin/${parts[2]}`
    : path.startsWith('master/')
      ? path
      : `payments/${path}`;
  try {
    const response = await fetch(`${backend}/api/${target}`, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {}),
      },
      ...(request.method === 'GET' ? {} : { body: await request.text() }),
      cache: 'no-store',
      signal: AbortSignal.timeout(25000),
    });
    const receipt = path.endsWith('/receipt') && response.ok;
    return new Response(await response.text(), {
      status: response.status,
      headers: {
        'Content-Type': receipt ? 'text/html; charset=utf-8' : 'application/json',
        'Cache-Control': 'private, no-store',
        ...(receipt
          ? {
              'Content-Disposition': 'attachment; filename="niral-payment-receipt.html"',
              'Content-Security-Policy':
                "default-src 'none'; style-src 'unsafe-inline'; sandbox",
            }
          : {}),
      },
    });
  } catch {
    return Response.json(
      {
        message:
          'Service unavailable. Check your payment status before retrying checkout.',
      },
      { status: 503 },
    );
  }
}
export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
