import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInThisContext} from 'node:vm';
import ts from 'typescript';
import {createClient} from '@libsql/client';
import {adaptDatabase} from '../lib/database.mjs';
import {migrate} from '../lib/migrations.mjs';
import {Business,errorResponse} from '../lib/business.mjs';
import * as limits from '../lib/upload-limits.mjs';

async function setup(t){
 const client=createClient({url:':memory:'});t.after(()=>client.close());await migrate(client);
 const db=adaptDatabase(client),service=new Business(db);
 const admin=await service.user({userId:'admin',email:'admin@example.test',displayName:'Admin'});
 const customer=await service.user({userId:'customer',email:'customer@example.test',displayName:'Customer'});
 const other=await service.user({userId:'other',email:'other@example.test',displayName:'Other'});
 const leadId=await service.act(admin,'lead.create',{name:'Customer',mobile:'9876543210',email:customer.email,address:'Test address',city:'Jaipur',state:'Rajasthan',pin:'302001',capacity:3,system:'On-grid',property:'Residential',finance:'Cash'});
 const projectId=await service.act(admin,'project.create',{leadId});
 const id=await service.upload(admin,{projectId,documentType:'Other',name:'Customer bill.pdf',mime:'application/pdf',size:20,key:'private-test-key'});
 let identity={userId:customer.id},reads=0,stored=true;
 const bytes=new Uint8Array(Buffer.from('%PDF-1.4\npreview'));
 const dependencies={
  '@/lib/upload-limits.mjs':limits,
  '@/lib/request-origin.mjs':{isSameOrigin:()=>true},
  '@/lib/request-body':{readLimitedBody:()=>{throw new Error('Unexpected upload');}},
  '@/lib/database.mjs':{getDatabase:()=>db},
  '@/lib/storage.mjs':{createStorage:()=>({get:async key=>{reads++;assert.equal(key,'private-test-key');return stored?bytes:null;}})},
  '@/lib/portal-auth':{getPortalIdentity:async()=>identity},
  '@/lib/business.mjs':{Business,errorResponse},
 };
 const loaded={exports:{}};
 const source=ts.transpileModule(readFileSync(new URL('../app/api/files/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 runInThisContext(`(function(require,module,exports){${source}\n})`)(name=>{assert.ok(name in dependencies,name);return dependencies[name];},loaded,loaded.exports);
 return {id,db,other,reads:()=>reads,setIdentity:value=>{identity=value;},removeFile:()=>{stored=false;},get:query=>loaded.exports.GET(new Request(`https://solar.example.test/api/files?${query}`))};
}

test('authorized PDF and image previews are inline, private, and keep download separate',async t=>{
 const s=await setup(t);
 for(const mime of ['application/pdf','image/jpeg','image/png']){
  await s.db.prepare("UPDATE records SET data=json_set(data,'$.mime',?) WHERE id=?").bind(mime,s.id).run();
  const response=await s.get(`id=${s.id}&preview=1`);
  assert.equal(response.status,200);assert.equal(response.headers.get('Content-Type'),mime);
  assert.match(response.headers.get('Content-Disposition'),/^inline; filename="Customer_bill.pdf"/);
  assert.equal(response.headers.get('Cache-Control'),'private, no-store');
  assert.equal(response.headers.get('X-Content-Type-Options'),'nosniff');
  assert.equal(await response.text(),'%PDF-1.4\npreview');
 }
 assert.match((await s.get(`id=${s.id}`)).headers.get('Content-Disposition'),/^attachment;/);
});

test('preview requests require authentication and file permission before reading storage',async t=>{
 const s=await setup(t);
 s.setIdentity(null);assert.equal((await s.get(`id=${s.id}&preview=1`)).status,401);
 s.setIdentity({userId:s.other.id});assert.equal((await s.get(`id=${s.id}&preview=1`)).status,403);
 assert.equal((await s.get('id=missing&preview=1')).status,404);
 assert.equal(s.reads(),0);
});

test('preview does not render unsupported content inline and missing files return 404',async t=>{
 const s=await setup(t);
 await s.db.prepare("UPDATE records SET data=json_set(data,'$.mime','text/html') WHERE id=?").bind(s.id).run();
 assert.match((await s.get(`id=${s.id}&preview=1`)).headers.get('Content-Disposition'),/^attachment;/);
 s.removeFile();assert.equal((await s.get(`id=${s.id}&preview=1`)).status,404);
});
