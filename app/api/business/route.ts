import { readLimitedBody } from '@/lib/request-body';
import { env } from 'cloudflare:workers';
import { getPortalIdentity } from '@/lib/portal-auth';
import { Business, errorResponse } from '@/lib/business.mjs';
export const dynamic = 'force-dynamic';
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){try {if(!env.DB)throw new Error('Database unavailable');const service=new Business(env.DB);const user=await service.user(await getPortalIdentity());return json(await service.snapshot(user));}catch(e){const r=errorResponse(e);return json(r,r.status);}}
export async function POST(request:Request){
 try{const origin=request.headers.get('origin');if(!origin||origin!==new URL(request.url).origin)return json({error:'Request origin is not permitted.'},403);
 if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Use JSON.'},415);
 if(Number(request.headers.get('content-length'))>65536)return json({error:'Request too large.'},413);
 const raw=new TextDecoder().decode(await readLimitedBody(request,65536));
 let payload;try{payload=JSON.parse(raw);}catch{return json({error:'Invalid JSON body.'},400);}if(!payload||typeof payload!=='object'||Array.isArray(payload))return json({error:'Expected a JSON object.'},400);const {action,data}=payload;if(!env.DB)throw new Error('Database unavailable');const service=new Business(env.DB);const user=await service.user(await getPortalIdentity(),action==='profile'?data?.role:undefined);
 const id=await service.act(user,action,data);return json({ok:true,id});
 }catch(e){const r=errorResponse(e);return json(r,r.status);}
}
