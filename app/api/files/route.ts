import { readLimitedBody } from '@/lib/request-body';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../../chatgpt-auth';
import { Business, errorResponse } from '@/lib/business.mjs';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{if(!env.DB||!env.BUCKET)throw new Error('Storage unavailable');const s=new Business(env.DB);const u=await s.user(await getChatGPTUser());const r=await s.fileAccess(u,new URL(req.url).searchParams.get('id'));const file=await env.BUCKET.get(r.data.fileKey);if(!file)return Response.json({error:'File not found.'},{status:404});return new Response(file.body,{headers:{'Content-Type':r.data.mime,'Content-Disposition':`attachment; filename="${r.data.name.replace(/[^a-zA-Z0-9._-]/g,'_')}"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch(e){const r=errorResponse(e);return Response.json(r,{status:r.status});}}
export async function POST(req:Request){try{
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Request origin is not permitted.'},{status:403});
 if(Number(req.headers.get('content-length'))>6*1024*1024)return Response.json({error:'Maximum file size is 5 MB.'},{status:413});
 if(!env.DB||!env.BUCKET)throw new Error('Storage unavailable');const s=new Business(env.DB);const u=await s.user(await getChatGPTUser());await s.limit(u.id);
 const bytesBody=await readLimitedBody(req,6*1024*1024);const boundedRequest=new Request(req.url,{method:'POST',headers:req.headers,body:bytesBody as BodyInit});const form=await boundedRequest.formData();const file=form.get('file');const projectId=String(form.get('projectId')||'');if(projectId)await s.access(u,projectId);else if(form.get('documentType')!=='Partner KYC'||u.role!=='PARTNER')return Response.json({error:'Select an authorized project.'},{status:403});
 if(!(file instanceof File)||file.size===0||file.size>5*1024*1024)return Response.json({error:'Choose a PDF, JPEG or PNG under 5 MB.'},{status:400});
 const bytes=new Uint8Array(await file.arrayBuffer());const hex=[...bytes.slice(0,8)].map(b=>b.toString(16).padStart(2,'0')).join('');
 const mime=hex.startsWith('255044462d')?'application/pdf':hex.startsWith('ffd8ff')?'image/jpeg':hex==='89504e470d0a1a0a'?'image/png':null;
 if(!mime||mime!==file.type)return Response.json({error:'File content must match a PDF, JPEG or PNG.'},{status:400});
 const documentType=String(form.get('documentType')||'').trim();if(!documentType||documentType.length>100)return Response.json({error:'Select a document type.'},{status:400});
 const key=`documents/${projectId}/${crypto.randomUUID()}`;await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});
 try{const id=await s.upload(u,{projectId,documentType,name:file.name.slice(0,200),mime,size:file.size,key});return Response.json({ok:true,id});}catch(e){await env.BUCKET.delete(key);throw e;}
 }catch(e){const r=errorResponse(e);return Response.json(r,{status:r.status});}}
