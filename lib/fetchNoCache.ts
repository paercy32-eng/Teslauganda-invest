// Wrapper around fetch that ALWAYS bypasses caching.
// Adds a unique timestamp to every GET request so Vercel
// treats each one as a new URL (no cache possible).
export async function fetchNoCache(
  url: string,
  options?: RequestInit
): Promise<Response> {
  const method = (options?.method ?? 'GET').toUpperCase();
  let finalUrl = url;

  if (method === 'GET') {
    const sep = url.includes('?') ? '&' : '?';
    finalUrl = `${url}${sep}_=${Date.now()}`;
  }

  const res = await fetch(finalUrl, {
    ...options,
    cache: 'no-store',
    headers: {
      ...(options?.headers ?? {}),
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    },
  });

  return res;
}
