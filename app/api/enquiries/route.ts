import { getDatabase } from '@/lib/database.mjs';
import { submitPublicEnquiry } from '@/lib/enquiries.mjs';
import { errorResponse } from '@/lib/business.mjs';
import { isSameOrigin } from '@/lib/request-origin.mjs';
import { readLimitedBody } from '@/lib/request-body';
export const runtime = 'nodejs';
const respond = (value: unknown, status = 200) => Response.json(value, { status, headers: { 'Cache-Control': 'no-store', ...(status === 429 ? { 'Retry-After': '900' } : {}) } });
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return respond({ error: 'Request origin is not permitted.' }, 403);
  if (!request.headers.get('content-type')?.includes('application/json')) return respond({ error: 'Use JSON.' }, 415);
  try {
    const raw = new TextDecoder().decode(await readLimitedBody(request, 8192));
    let input;
    try { input = JSON.parse(raw); } catch { return respond({ error: 'Invalid enquiry. Please check your details.' }, 400); }
    return respond(await submitPublicEnquiry(getDatabase(), input));
  } catch (error) {
    const result = errorResponse(error);
    return respond(result, result.status);
  }
}
