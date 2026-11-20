import { headers } from 'next/headers';
import { env } from 'cloudflare:workers';
import { getChatGPTUser, type ChatGPTUser } from '@/app/chatgpt-auth';
import { readSessionCookie,sessionUser } from './local-auth.mjs';
export const localPortalAuth=()=>typeof __SOLARIS_LOCAL_AUTH__!=='undefined'&&__SOLARIS_LOCAL_AUTH__;
export async function getPortalIdentity():Promise<ChatGPTUser|null>{
 if(!localPortalAuth())return getChatGPTUser();
 const h=await headers();
 if(!env.DB)return null;
 const user=await sessionUser(env.DB,readSessionCookie(h.get('cookie')||''));
 return user?{userId:user.id,email:user.email,displayName:user.name,fullName:user.name}:null;
}
