import { auth } from '@/auth';

import { apiOrigin } from '@/lib/api-origin';
const backend = apiOrigin();

const publicActions: Record<string, string> = {
  register: 'auth/register',
  'verify-email': 'auth/verify-email',
  'resend-verification': 'auth/resend-verification',
  'forgot-password': 'auth/forgot-password',
  'reset-password': 'auth/reset-password',
  'confirm-transition': 'auth/confirm-transition',
  'account-recovery': 'auth/account-recovery',
};

const NO_CACHE_HEADERS = {
  'Cache-Control': 'private, no-cache, no-store, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'Surrogate-Control': 'no-store',
};

async function proxy(request: Request, action: string) {
  if (!backend)
    return Response.json(
      {
        message:
          'The account service is not configured. Please contact the organizers or try again later.',
      },
      { status: 503, headers: NO_CACHE_HEADERS },
    );
  let bodyJson: Record<string, unknown> | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      bodyJson = await request.json();
    } catch {
      bodyJson = undefined;
    }
  }

  const publicPath = publicActions[action];
  let path: string | undefined = publicPath;

  if (!path) {
    switch (action) {
      case 'application':
        path = request.method === 'GET' ? 'enrollment/me' : 'enrollment';
        break;
      case 'summary':
        path = 'dashboard/summary';
        break;
      case 'profile':
        path = 'auth/me';
        break;
      case 'team':
        path = 'teams/me';
        break;
      case 'team-create':
        path = 'teams';
        break;
      case 'team-join':
        path = 'teams/join';
        break;
      case 'team-accept-invite':
        path = 'teams/accept-invite';
        break;
      case 'team-leave':
        path = 'teams/leave';
        break;
      case 'team-remove-member':
        path = 'teams/remove-member';
        break;
      case 'team-invite':
        path = 'teams/invite';
        break;
      case 'team-cancel-invite':
        path = 'teams/cancel-invite';
        break;
      case 'team-invitations':
        path = 'teams/invitations';
        break;
      case 'team-discover':
        path = 'teams/discover';
        break;
      case 'announcements':
        path = 'dashboard/announcements';
        break;
      case 'announcement-read':
        path = bodyJson?.id ? `dashboard/announcements/${bodyJson.id}/read` : undefined;
        break;
      case 'announcements-read-all':
        path = 'dashboard/announcements/read-all';
        break;
      case 'notifications':
        path = 'dashboard/notifications';
        break;
      default:
        path = undefined;
    }
  }

  if (!path) {
    return Response.json(
      { message: 'Not found' },
      { status: 404, headers: NO_CACHE_HEADERS },
    );
  }

  if (request.method === 'GET' && publicPath) {
    return Response.json(
      { message: 'Method not allowed' },
      { status: 405, headers: NO_CACHE_HEADERS },
    );
  }

  if (
    request.method !== 'GET' &&
    request.headers.get('origin') &&
    request.headers.get('origin') !== new URL(request.url).origin
  ) {
    return Response.json(
      { message: 'Invalid request origin' },
      { status: 403, headers: NO_CACHE_HEADERS },
    );
  }

  const session = publicPath ? null : await auth();
  if (!publicPath && !session?.accessToken) {
    return Response.json(
      { message: 'Sign in to continue.' },
      { status: 401, headers: NO_CACHE_HEADERS },
    );
  }

  try {
    const response = await fetch(`${backend}/api/${path}`, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {}),
      },
      body: bodyJson !== undefined ? JSON.stringify(bodyJson) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json().catch(() => ({}));

    if (action === 'register' && response.ok) {
      return Response.json(
        { message: data.message, emailDelivery: data.emailDelivery },
        { status: response.status, headers: NO_CACHE_HEADERS },
      );
    }

    return Response.json(data, {
      status: response.status,
      headers: NO_CACHE_HEADERS,
    });
  } catch {
    return Response.json(
      { message: 'The service is unavailable. Please try again later.' },
      { status: 503, headers: NO_CACHE_HEADERS },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  return proxy(request, (await params).action);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  return proxy(request, (await params).action);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ action: string }> },
) {
  return proxy(request, (await params).action);
}
