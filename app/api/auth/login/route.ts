import { env } from 'cloudflare:workers';
import { localPortalAuth } from '@/lib/portal-auth';
import { login,readSessionCookie,SESSION_COOKIE,SESSION_SECONDS } from '@/lib/local-auth.mjs';
import { errorResponse } from '@/lib/business.mjs';
import { readLimitedBody } from '@/lib/request-body';
export async function POST(req:Request){
 const headers={'Cache-Control':'no-store'};
 if(!localPortalAuth())return Response.json({error:'Use the hosted sign-in.'},{status:404,headers});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Request origin is not permitted.'},{status:403,headers});
 if(!req.headers.get('content-type')?.includes('application/json'))return Response.json({error:'Use JSON.'},{status:415,headers});
 try{
  if(!env.DB)throw new Error('Database unavailable');
  let data;try{data=JSON.parse(new TextDecoder().decode(await readLimitedBody(req,4096)));}catch{return Response.json({error:'Invalid sign-in request.'},{status:400,headers});}
  const {token}=await login(env.DB,data||{},readSessionCookie(req.headers.get('cookie')||''));
  return Response.json({ok:true,redirect:'/portal'},{headers:{...headers,'Set-Cookie':`${SESSION_COOKIE}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${SESSION_SECONDS}${new URL(req.url).protocol==='https:'?'; Secure':''}`}});
 }catch(e){const r=errorResponse(e);return Response.json(r,{status:r.status,headers});}
}
