import assert from 'node:assert/strict';
const origin=process.env.SOLARIS_TEST_ORIGIN||'http://127.0.0.1:5186';
assert(['127.0.0.1','localhost'].includes(new URL(origin).hostname),'Smoke tests are restricted to local development.');
const home=await fetch(origin);assert.equal(home.status,200);const html=await home.text();assert.match(html,/A brighter world/);assert.match(html,/earth.webp/);
assert.equal((await fetch(origin+'/api/business')).status,401);
assert.equal((await fetch(origin+'/api/business',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:'{}'})).status,403);
const signin=await fetch(origin+'/signin-with-chatgpt?return_to=%2Fportal',{redirect:'manual'});assert.equal(signin.status,302);const cookie=signin.headers.get('set-cookie')?.split(';')[0];assert.ok(cookie);
const headers={Cookie:cookie,Origin:origin,'Content-Type':'application/json'};
async function action(action,data){const r=await fetch(origin+'/api/business',{method:'POST',headers,body:JSON.stringify({action,data})});const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));return j;}
const snapshot=await fetch(origin+'/api/business',{headers:{Cookie:cookie}});const data=await snapshot.json();assert.equal(snapshot.status,200,JSON.stringify(data));assert.equal(data.user.role,'ADMIN');
const tag=String(Date.now());const lead=await action('lead.create',{name:'Local HTTP Test',mobile:'9'+tag.slice(-9),email:`http-${tag}@example.test`,address:'Test-only address',city:'Test City',state:'Rajasthan',pin:'302001',capacity:3,system:'On-grid',property:'Residential',finance:'Cash',remarks:'Local smoke-test fixture'});
const project=await action('project.create',{leadId:lead.id});
const form=new FormData();form.append('projectId',project.id);form.append('documentType','Site photograph');form.append('file',new File([new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x37]),'\n%%EOF'],'smoke.pdf',{type:'application/pdf'}));
const upload=await fetch(origin+'/api/files',{method:'POST',headers:{Cookie:cookie,Origin:origin},body:form});const uploaded=await upload.json();assert.equal(upload.status,200,JSON.stringify(uploaded));
const file=await fetch(origin+'/api/files?id='+uploaded.id,{headers:{Cookie:cookie}});assert.equal(file.status,200);assert.equal(file.headers.get('content-type'),'application/pdf');assert.match(file.headers.get('content-disposition'),/attachment/);
assert.equal((await fetch(origin+'/api/files?id='+uploaded.id)).status,401);
const bad=await fetch(origin+'/api/business',{method:'POST',headers,body:'{bad'});assert.equal(bad.status,400);
console.log('HTTP checks passed: landing, authentication, CSRF, real lead/project writes, private R2 upload/download, malformed JSON.');
