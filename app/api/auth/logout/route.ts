import { isSameOrigin, secureCookie } from '@/lib/request-origin.mjs';
import { getDatabase } from '@/lib/database.mjs';
import { logout,readSessionCookie,SESSION_COOKIE } from '@/lib/local-auth.mjs';
export const runtime = 'nodejs';
export async function POST(req:Request){
 if(!isSameOrigin(req))return new Response('Forbidden',{status:403});
 const token=readSessionCookie(req.headers.get('cookie')||'');
 if(token)await logout(getDatabase(),token);
 return Response.json({ok:true,redirect:'/login'},{headers:{'Cache-Control':'no-store','Set-Cookie':`${SESSION_COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secureCookie(req)?'; Secure':''}`}});
}
