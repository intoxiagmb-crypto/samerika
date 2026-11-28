// Keep app navigation through sign-in without accepting arbitrary redirect URLs.
export function portalDestination(value: unknown): string {
  if (typeof value !== 'string') return '/portal';
  if (value === '/portal') return value;
  if (!value.startsWith('/portal?')) return '/portal';
  const source = new URLSearchParams(value.slice('/portal?'.length));
  const destination = new URLSearchParams();
  for (const key of ['view', 'notifications', 'project', 'detail', 'type']) {
    const item = source.get(key);
    if (item && /^[a-zA-Z0-9_-]{1,100}$/.test(item)) destination.set(key, item);
  }
  return destination.size ? `/portal?${destination}` : '/portal';
}
