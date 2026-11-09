export async function accountRequest<T>(
  action: string,
  body?: unknown,
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE',
): Promise<T> {
  const response = await fetch(`/api/account/${action}`, {
    method: method ?? (body === undefined ? 'GET' : 'POST'),
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: 'no-store',
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(' ')
        : (data.message ?? 'Please try again later.'),
    );
  return data as T;
}
