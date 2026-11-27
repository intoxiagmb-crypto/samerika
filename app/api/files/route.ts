import { MAX_UPLOAD_BYTES, MAX_UPLOAD_REQUEST_BYTES } from '@/lib/upload-limits.mjs';
import { isSameOrigin } from '@/lib/request-origin.mjs';
import { readLimitedBody } from '@/lib/request-body';
import { getDatabase } from '@/lib/database.mjs';
import { createStorage } from '@/lib/storage.mjs';
export const runtime = 'nodejs';
import { getPortalIdentity } from '@/lib/portal-auth';
import { Business, errorResponse } from '@/lib/business.mjs';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{
 const identity=await getPortalIdentity();if(!identity)return Response.json({error:'Sign in to continue.'},{status:401});
 const s=new Business(getDatabase()),u=await s.user(identity),url=new URL(req.url);
 const r=await s.fileAccess(u,url.searchParams.get('id'));
 const file=await createStorage().get(r.data.fileKey);if(!file)return Response.json({error:'File not found.'},{status:404});
 const preview=url.searchParams.get('preview')==='1'&&['application/pdf','image/jpeg','image/png'].includes(r.data.mime);
 return new Response(file,{headers:{'Content-Type':r.data.mime,'Content-Disposition':`${preview?'inline':'attachment'}; filename="${r.data.name.replace(/[^a-zA-Z0-9._-]/g,'_')}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }catch(e){const r=errorResponse(e);return Response.json(r,{status:r.status});}}
export async function POST(req:Request){try{
 if(!isSameOrigin(req))return Response.json({error:'Request origin is not permitted.'},{status:403});
 if(Number(req.headers.get('content-length'))>MAX_UPLOAD_REQUEST_BYTES)return Response.json({error:'Maximum file size is 2 MB.'},{status:413});
 const identity=await getPortalIdentity();if(!identity)return Response.json({error:'Sign in to continue.'},{status:401});const s=new Business(getDatabase());const u=await s.user(identity);const storage=createStorage();await s.limit(u.id);
 const bytesBody=await readLimitedBody(req,MAX_UPLOAD_REQUEST_BYTES);const boundedRequest=new Request(req.url,{method:'POST',headers:req.headers,body:bytesBody as BodyInit});const form=await boundedRequest.formData();const file=form.get('file');const projectId=String(form.get('projectId')||'');if(projectId)await s.access(u,projectId);else if(form.get('documentType')!=='Partner KYC'||u.role!=='PARTNER')return Response.json({error:'Select an authorized project.'},{status:403});
 if(!(file instanceof File)||file.size===0||file.size>MAX_UPLOAD_BYTES)return Response.json({error:'Choose a PDF, JPEG or PNG up to 2 MB.'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());const hex=[...bytes.slice(0,8)].map(b=>b.toString(16).padStart(2,'0')).join('');
 const mime=hex.startsWith('255044462d')?'application/pdf':hex.startsWith('ffd8ff')?'image/jpeg':hex==='89504e470d0a1a0a'?'image/png':null;
 if(!mime||mime!==file.type)return Response.json({error:'File content must match a PDF, JPEG or PNG.'},{status:400});
 const documentType=String(form.get('documentType')||'').trim();if(!documentType||documentType.length>100)return Response.json({error:'Select a document type.'},{status:400});
 const key=`documents/${projectId||'kyc'}/${crypto.randomUUID()}`;await storage.put(key,bytes,mime);
 try{const id=await s.upload(u,{projectId,documentType,name:file.name.slice(0,200),mime,size:file.size,key});return Response.json({ok:true,id});}catch(e){await storage.delete(key);throw e;}
 }catch(e){const r=errorResponse(e);return Response.json(r,{status:r.status});}}
