import { headers } from 'next/headers';
import { getDatabase } from './database.mjs';
import { readSessionCookie, sessionUser } from './local-auth.mjs';

export async function getPortalIdentity() {
  const requestHeaders = await headers();
  const token = readSessionCookie(requestHeaders.get('cookie') || '');
  if (!token) return null;
  const user = await sessionUser(getDatabase(), token);
  return user ? { userId: String(user.id), email: String(user.email), displayName: String(user.name), fullName: String(user.name) } : null;
}
