import { getDatabase } from '@/lib/database.mjs';
import { readSessionCookie, sessionUser } from '@/lib/local-auth.mjs';
import { errorResponse } from '@/lib/business.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store', Vary: 'Cookie' };
  try {
    const token = readSessionCookie(request.headers.get('cookie') || '');
    const user = token ? await sessionUser(getDatabase(), token) : null;
    return Response.json({ authenticated: Boolean(user) }, { status: user ? 200 : 401, headers });
  } catch (error) {
    const result = errorResponse(error);
    return Response.json(result, { status: result.status, headers });
  }
}
