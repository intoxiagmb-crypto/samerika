import { isSameOrigin } from '@/lib/request-origin.mjs';
import { readLimitedBody } from '@/lib/request-body';
import { getDatabase } from '@/lib/database.mjs';
import { createQuotationShare, revokeQuotationShares } from '@/lib/quotation-sharing.mjs';
import { createAccount, resetAccountPassword } from '@/lib/accounts.mjs';
export const runtime = 'nodejs';
import { getPortalUser } from '@/lib/portal-auth';
import { Business, errorResponse } from '@/lib/business.mjs';
export const dynamic = 'force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try {const user=await getPortalUser();if(!user)return json({error:'Sign in to continue.'},401);const db=getDatabase();const service=new Business(db);return json(await service.snapshot(user));}catch(e){const r=errorResponse(e);return json(r,r.status);}}
export async function POST(request:Request){
 try{if(!isSameOrigin(request))return json({error:'Request origin is not permitted.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Use JSON.'},415);
 if(Number(request.headers.get('content-length'))>65536)return json({error:'Request too large.'},413);
 const raw=new TextDecoder().decode(await readLimitedBody(request,65536));
 let payload;try{payload=JSON.parse(raw);}catch{return json({error:'Invalid JSON body.'},400);}if(!payload||typeof payload!=='object'||Array.isArray(payload))return json({error:'Expected a JSON object.'},400);const {action,data}=payload;const user=await getPortalUser();if(!user)return json({error:'Sign in to continue.'},401);const db=getDatabase();const service=new Business(db);
 if(action==='quote.share')return json({ok:true,...await createQuotationShare(db,user,data?.id,Date.now(),request.headers.get('origin'),{publish:data?.publish===true})});
 if(action==='quote.share.revoke'){await revokeQuotationShares(db,user,data?.id);return json({ok:true});}
 const id=action==='user.create'?await createAccount(db,user,data):action==='user.password_reset'?await resetAccountPassword(db,user,data):await service.act(user,action,data);return json({ok:true,id});
 }catch(e){const r=errorResponse(e);return json(r,r.status);}
}
