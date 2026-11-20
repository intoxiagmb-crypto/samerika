import { env } from 'cloudflare:workers';
import { localPortalAuth } from '@/lib/portal-auth';
import { logout,readSessionCookie,SESSION_COOKIE } from '@/lib/local-auth.mjs';
export async function POST(req:Request){
 if(req.headers.get('origin')!==new URL(req.url).origin)return new Response('Forbidden',{status:403});
 if(localPortalAuth()&&env.DB)await logout(env.DB,readSessionCookie(req.headers.get('cookie')||''));
 return Response.json({ok:true,redirect:localPortalAuth()?'/login':'/signout-with-chatgpt?return_to=%2Flogin'},{headers:{'Cache-Control':'no-store','Set-Cookie':`${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`}});
}
