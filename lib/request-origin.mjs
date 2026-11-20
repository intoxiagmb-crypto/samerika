// Next.js can reconstruct request.url using its internal listening hostname.
// Compare the browser's Origin with the actual HTTP Host, never a caller-supplied forwarded host.
export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin || origin === 'null') return false;
  try {
    const parsed = new URL(origin);
    const protocol = request.headers.get('x-forwarded-proto') || new URL(request.url).protocol.slice(0, -1);
    const host = request.headers.get('host') || new URL(request.url).host;
    return ['http', 'https'].includes(protocol) && parsed.origin === origin && parsed.protocol === `${protocol}:` && parsed.host === host;
  } catch { return false; }
}

export function secureCookie(request) {
  return process.env.VERCEL === '1' || request.headers.get('x-forwarded-proto') === 'https' || new URL(request.url).protocol === 'https:';
}
