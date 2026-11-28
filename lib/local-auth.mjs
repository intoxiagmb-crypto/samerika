import { scrypt, scryptSync, randomBytes, createHash, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { BusinessError } from './policy.mjs';
export const SESSION_COOKIE='solaris_session';
export const SESSION_SECONDS=12*60*60;
export function hashPassword(password,salt=randomBytes(16).toString('hex')) {
 return {salt,hash:scryptSync(password,salt,32,{N:16384,r:8,p:5,maxmem:32*1024*1024}).toString('hex')};
}
export function verifyPassword(password,salt,hash){const actual=Buffer.from(hashPassword(password,salt).hash,'hex'),expected=Buffer.from(hash,'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected);}
const scryptAsync=promisify(scrypt);
export async function hashPasswordAsync(password,salt=randomBytes(16).toString('hex')){
 const hash=await scryptAsync(password,salt,32,{N:16384,r:8,p:5,maxmem:32*1024*1024});
 return {salt,hash:hash.toString('hex')};
}
export async function verifyPasswordAsync(password,salt,hash){const actual=Buffer.from((await hashPasswordAsync(password,salt)).hash,'hex'),expected=Buffer.from(hash,'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected);}
export const tokenHash=token=>createHash('sha256').update(token).digest('hex');
export function readSessionCookie(value=''){return value.split(';').map(s=>s.trim()).find(s=>s.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1)||'';}
export function portalForRole(role){return role==='CUSTOMER'?'customer':role==='PARTNER'?'agent':role==='ADMIN'?'company':['SALES','MANAGER','TECHNICAL','VERIFIER','FINANCE'].includes(role)?'staff':null;}
export async function sessionUser(db,token){
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 return await db.prepare('SELECT u.* FROM local_sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>? AND u.status IN (?,?)').bind(tokenHash(token),Date.now(),'Active','Pending').first();
}
export async function login(db,{email,password,portal},previousToken=''){
 if(typeof email!=='string'||typeof password!=='string'||email.length>254||password.length>256||!['auto','agent','company','staff','customer'].includes(portal))throw new BusinessError('Enter your email and password.',400);
 email=email.trim().toLowerCase();const now=Date.now(),key='login:'+tokenHash(email);
 const limit=await db.prepare('INSERT INTO request_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<? THEN ? ELSE expires_at END RETURNING count').bind(key,now+15*60*1000,now,now,now+15*60*1000).first();
 if(limit.count>10)throw new BusinessError('Too many sign-in attempts. Try again in 15 minutes.',429);
 const row=await db.prepare('SELECT u.*,c.salt,c.password_hash FROM users u JOIN local_credentials c ON c.user_id=u.id WHERE u.email=?').bind(email).first();
 const valid=await verifyPasswordAsync(password,row?.salt||'00000000000000000000000000000000',row?.password_hash||'0'.repeat(64));
 // The shared sign-in form discovers the workspace only after verifying the password.
 // Explicit portal callers retain their strict check; permissions always use the stored role.
 if(!row||!valid||!['Active','Pending'].includes(row.status)||!portalForRole(row.role)||(portal!=='auto'&&portalForRole(row.role)!==portal))throw new BusinessError(portal==='auto'?'Email or password is incorrect. Use the latest password provided by your administrator.':'Email or password is incorrect for this portal.',401);
 const token=randomBytes(32).toString('hex');
 await db.batch([
  db.prepare('DELETE FROM local_sessions WHERE expires_at<=? OR token_hash=?').bind(now,tokenHash(previousToken)),
  db.prepare('INSERT INTO local_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(tokenHash(token),row.id,now+SESSION_SECONDS*1000),
  db.prepare('DELETE FROM request_limits WHERE key=?').bind(key)
 ]);
 return {token,user:row};
}
export async function logout(db,token){if(token)await db.prepare('DELETE FROM local_sessions WHERE token_hash=?').bind(tokenHash(token)).run();}
