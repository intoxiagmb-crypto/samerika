import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const origin=process.env.SOLARIS_TEST_ORIGIN||'http://127.0.0.1:5175';
assert(['127.0.0.1','localhost'].includes(new URL(origin).hostname),'Smoke tests are restricted to local development.');
const credentials=JSON.parse(readFileSync(new URL('../.sites-runtime/demo-credentials.json',import.meta.url),'utf8'));
const home=await fetch(origin);assert.equal(home.status,200);assert.match(await home.text(),/A brighter future/);
for(const path of ['/login','/login/agent','/login/company'])assert.equal((await fetch(origin+path)).status,200);
const protectedPage=await fetch(origin+'/portal',{redirect:'manual'});assert.ok([302,307].includes(protectedPage.status));assert.equal(protectedPage.headers.get('location'),'/login');
assert.equal((await fetch(origin+'/api/business')).status,401);
assert.equal((await fetch(origin+'/api/business',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:'{}'})).status,403);
async function signin(portal,values=credentials[portal]){return fetch(origin+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({...values,portal})});}
assert.equal((await signin('company',credentials.agent)).status,401);
assert.equal((await signin('agent',{...credentials.agent,password:'incorrect'})).status,401);
assert.equal((await fetch(origin+'/api/auth/login',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:JSON.stringify({...credentials.agent,portal:'agent'})})).status,403);
const cookies={};for(const portal of ['agent','company']){const r=await signin(portal);assert.equal(r.status,200,await r.text());const header=r.headers.get('set-cookie');assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Lax/);cookies[portal]=header.split(';')[0];}
async function snapshot(portal){const r=await fetch(origin+'/api/business',{headers:{Cookie:cookies[portal]}});const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));return j;}
assert.equal((await snapshot('agent')).user.role,'PARTNER');assert.equal((await snapshot('company')).user.role,'ADMIN');assert.equal((await snapshot('agent')).users.length,0);
const headers=portal=>({Cookie:cookies[portal],Origin:origin,'Content-Type':'application/json'});
async function action(portal,action,data,expected=200){const r=await fetch(origin+'/api/business',{method:'POST',headers:headers(portal),body:JSON.stringify({action,data})});const j=await r.json();assert.equal(r.status,expected,JSON.stringify(j));return j;}
await action('agent','settings',{},403);
const tag=String(Date.now());const lead=await action('agent','lead.create',{name:'Demo · Requirement test',mobile:'9'+tag.slice(-9),email:`http-${tag}@solaris.demo`,address:'Demo requirement address',city:'Jaipur',state:'Rajasthan',pin:'302001',capacity:3,system:'On-grid',property:'Residential',finance:'Cash',remarks:'Local verification fixture'});
const companyData=await snapshot('company');assert.ok(companyData.leads.find(l=>l.id===lead.id&&l.partner_id==='local-demo-agent'));
const project=await action('company','project.create',{leadId:lead.id});assert.ok((await snapshot('agent')).projects.some(p=>p.id===project.id));
await action('agent','project.update',{id:project.id,status:'Completed'},403);
const companyLead=await action('company','lead.create',{name:'Demo · Company-only requirement',mobile:'8'+tag.slice(-9),email:`private-${tag}@solaris.demo`,address:'Demo company-only site',city:'Jaipur',state:'Rajasthan',pin:'302001',capacity:3,system:'On-grid',property:'Residential',finance:'Cash',remarks:'Local role-isolation verification fixture'});
assert.equal((await snapshot('agent')).leads.some(l=>l.id===companyLead.id),false);
const form=new FormData();form.append('projectId',project.id);form.append('documentType','Electricity bill');form.append('file',new File([new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x37]),'\n%%EOF'],'demo.pdf',{type:'application/pdf'}));
const upload=await fetch(origin+'/api/files',{method:'POST',headers:{Cookie:cookies.agent,Origin:origin},body:form});const uploaded=await upload.json();assert.equal(upload.status,200,JSON.stringify(uploaded));
const file=await fetch(origin+'/api/files?id='+uploaded.id,{headers:{Cookie:cookies.company}});assert.equal(file.status,200);assert.equal(file.headers.get('content-type'),'application/pdf');
assert.equal((await fetch(origin+'/api/files?id='+uploaded.id)).status,401);
const bad=await fetch(origin+'/api/business',{method:'POST',headers:headers('agent'),body:'{bad'});assert.equal(bad.status,400);
for(const portal of ['agent','company']){const r=await fetch(origin+'/api/auth/logout',{method:'POST',headers:{Origin:origin,Cookie:cookies[portal]}});assert.equal(r.status,200);assert.equal((await fetch(origin+'/api/business',{headers:{Cookie:cookies[portal]}})).status,401);}
console.log('PASS: all pages, protected routes, both logins, wrong portal/password, CSRF, agent/company isolation, persisted requirement → company → project → agent, private upload/download, sign-out and session revocation.');
