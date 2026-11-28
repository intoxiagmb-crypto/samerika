import { headers } from 'next/headers';
import { getDatabase } from './database.mjs';
import { readSessionCookie, sessionUser } from './local-auth.mjs';
import { accountName } from './brand-name.mjs';

export async function getPortalUser() {
  const requestHeaders = await headers();
  const token = readSessionCookie(requestHeaders.get('cookie') || '');
  if (!token) return null;
  const user = await sessionUser(getDatabase(), token);
  return user ? { ...user, name: accountName(user.name,user.role), profile: JSON.parse(user.profile || '{}') } : null;
}

export async function getPortalIdentity() {
  const user = await getPortalUser();
  return user ? { userId: String(user.id), email: String(user.email), displayName: String(user.name), fullName: String(user.name) } : null;
}
