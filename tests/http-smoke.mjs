import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const origin=process.env.SOLARIS_TEST_ORIGIN||'http://127.0.0.1:5175';
assert(['127.0.0.1','localhost'].includes(new URL(origin).hostname),'Smoke tests are restricted to local development.');
const credentials=JSON.parse(readFileSync(new URL('../.solaris/demo-credentials.json',import.meta.url),'utf8'));
const home=await fetch(origin);assert.equal(home.status,200);assert.match(await home.text(),/A brighter future/);
for(const path of ['/login','/login/agent','/login/company','/login/staff','/login/customer','/enquiry'])assert.equal((await fetch(origin+path)).status,200);
const plannedEnquiry=await fetch(origin+'/enquiry?property=Commercial&pin=302001&monthlyBill=4500');assert.equal(plannedEnquiry.status,200);const plannedMarkup=await plannedEnquiry.text();assert.match(plannedMarkup,/value="302001"/);assert.match(plannedMarkup,/4,500/);assert.match(plannedMarkup,/class="selected"><input[^>]*value="Commercial"/);
const invalidPlan=await fetch(origin+'/enquiry?pin=bad&monthlyBill=-100&property=unknown');assert.equal(invalidPlan.status,200);assert.doesNotMatch(await invalidPlan.text(),/customer estimate/);
const protectedPage=await fetch(origin+'/portal',{redirect:'manual'});assert.ok([302,307].includes(protectedPage.status));assert.equal(protectedPage.headers.get('location'),'/login');
assert.equal((await fetch(origin+'/api/business')).status,401);
assert.equal((await fetch(origin+'/api/business',{headers:{'oai-authenticated-user-id':'local-demo-company','oai-authenticated-user-email':credentials.company.email}})).status,401,'Forged identity headers must not authenticate');
assert.equal((await fetch(origin+'/api/business',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:'{}'})).status,403);
async function signin(portal,values=credentials[portal]){return fetch(origin+'/api/auth/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({...values,portal})});}
assert.equal((await signin('company',credentials.agent)).status,401);
assert.equal((await signin('agent',{...credentials.agent,password:'incorrect'})).status,401);
assert.equal((await fetch(origin+'/api/auth/login',{method:'POST',headers:{Origin:'https://attacker.example','Content-Type':'application/json'},body:JSON.stringify({...credentials.agent,portal:'agent'})})).status,403);
assert.equal((await signin('company',credentials.staff)).status,401);
assert.equal((await signin('staff',credentials.company)).status,401);
const cookies={};for(const portal of ['agent','company','staff','customer']){const r=await signin(portal);assert.equal(r.status,200,await r.text());const header=r.headers.get('set-cookie');assert.match(header,/HttpOnly/);assert.match(header,/SameSite=Lax/);cookies[portal]=header.split(';')[0];}
async function snapshot(portal){const r=await fetch(origin+'/api/business',{headers:{Cookie:cookies[portal]}});const j=await r.json();assert.equal(r.status,200,JSON.stringify(j));return j;}
assert.equal((await snapshot('agent')).user.role,'PARTNER');assert.equal((await snapshot('company')).user.role,'ADMIN');assert.equal((await snapshot('agent')).users.length,0);
assert.equal((await snapshot('customer')).user.role,'CUSTOMER');
assert.equal((await snapshot('staff')).user.role,'SALES');
const headers=portal=>({Cookie:cookies[portal],Origin:origin,'Content-Type':'application/json'});
async function action(portal,action,data,expected=200){const r=await fetch(origin+'/api/business',{method:'POST',headers:headers(portal),body:JSON.stringify({action,data})});const j=await r.json();assert.equal(r.status,expected,JSON.stringify(j));return j;}
await action('agent','settings',{},403);
await action('agent','user.create',{name:'Escalation',email:'escalate@example.test',role:'ADMIN',password:'Never-allow-this-password!'},403);
const tag=String(Date.now());const lead=await action('agent','lead.create',{name:'Demo · Requirement test',mobile:'9'+tag.slice(-9),email:`http-${tag}@solaris.demo`,address:'Demo requirement address',city:'Jaipur',state:'Rajasthan',pin:'302001',capacity:3,system:'On-grid',property:'Residential',finance:'Cash',remarks:'Local verification fixture'});
const companyData=await snapshot('company');assert.ok(companyData.leads.find(l=>l.id===lead.id&&l.partner_id==='local-demo-agent'));
const project=await action('company','project.create',{leadId:lead.id});assert.ok((await snapshot('agent')).projects.some(p=>p.id===project.id));
await action('agent','project.update',{id:project.id,status:'Completed'},403);
const trackProject=(await snapshot('staff')).projects.find(p=>p.id===project.id);assert.ok(trackProject);
await action('agent','project.tracking',{id:project.id,version:trackProject.version,applicationNumber:'NO-ACCESS'},403);
await action('staff','project.tracking',{id:project.id,version:trackProject.version,applicationNumber:'APP-'+tag,stepId:'registration',status:'Completed',eventDate:'2026-01-01',reference:'HTTP-ACK-'+tag});
assert.equal((await snapshot('agent')).projects.find(p=>p.id===project.id).data.tracking.steps.registration.status,'Completed');
await action('staff','project.tracking',{id:project.id,version:trackProject.version,applicationNumber:'STALE'},409);

const companyLead=await action('company','lead.create',{name:'Demo · Company-only requirement',mobile:'8'+tag.slice(-9),email:`private-${tag}@solaris.demo`,address:'Demo company-only site',city:'Jaipur',state:'Rajasthan',pin:'302001',capacity:3,system:'On-grid',property:'Residential',finance:'Cash',remarks:'Local role-isolation verification fixture'});
assert.equal((await snapshot('agent')).leads.some(l=>l.id===companyLead.id),false);
// Customer-first quotation creation must work through the actual authenticated API.
const item=await action('company','product.create',{name:'Demo · Quotation test item',brand:'Test',category:'Solar panel',capacity:1,price:100.25,taxRate:5,unit:'Pcs',hsn:'TEST',system:'On-grid',warranty:'Test fixture'});
const quote=await action('company','quote.create',{customerId:companyLead.id,items:[{productId:item.id,quantity:2,unitPrice:1}],validUntil:'2099-12-31',terms:'Local verification fixture'});
const quoted=await snapshot('company');const savedQuote=quoted.records.find(r=>r.id===quote.id);
assert.equal(savedQuote.amount,21053);assert.equal(savedQuote.data.items[0].unitPrice,10025);assert.equal(savedQuote.data.customerDetails.name,'Demo · Company-only requirement');
assert.ok(quoted.projects.some(p=>p.id===savedQuote.project_id&&p.lead_id===companyLead.id));
assert.equal((await snapshot('agent')).records.some(r=>r.id===quote.id),false);
const enquiryValues={name:'Demo · Public enquiry',mobile:'7'+tag.slice(-9),email:`enquiry-${tag}@solaris.demo`,city:'Jaipur',pin:'302001',property:'Residential',remarks:'Local public enquiry verification'};
const publicHeaders={Origin:origin,'Content-Type':'application/json'};
const submitEnquiry=values=>fetch(origin+'/api/enquiries',{method:'POST',headers:publicHeaders,body:JSON.stringify(values)});
const received=await submitEnquiry(enquiryValues);assert.equal(received.status,200);assert.deepEqual(await received.json(),{ok:true});
const receivedAgain=await submitEnquiry({...enquiryValues,name:'Do not overwrite'});assert.equal(receivedAgain.status,200);
const enquirySnapshot=await snapshot('company');const websiteLeads=enquirySnapshot.leads.filter(l=>l.mobile===enquiryValues.mobile);assert.equal(websiteLeads.length,1);assert.equal(websiteLeads[0].name,enquiryValues.name);assert.equal(websiteLeads[0].data.source,'Website');assert.equal(websiteLeads[0].status,'New');assert.equal(enquirySnapshot.notifications.some(n=>n.entity_id===websiteLeads[0].id),false);
const staffInbox=await snapshot('staff');assert.ok(staffInbox.leads.some(l=>l.id===websiteLeads[0].id));assert.ok(staffInbox.notifications.some(n=>n.entity_id===websiteLeads[0].id));
assert.equal((await snapshot('agent')).leads.some(l=>l.id===websiteLeads[0].id),false);
await action('staff','lead.update',{id:websiteLeads[0].id,status:'Contacted',note:'Staff follow-up verified'});
assert.equal((await snapshot('staff')).leads.find(l=>l.id===websiteLeads[0].id).status,'Contacted');
assert.equal((await submitEnquiry({...enquiryValues,mobile:'123'})).status,400);
assert.equal((await submitEnquiry({...enquiryValues,website:'spam'})).status,400);
assert.equal((await fetch(origin+'/api/enquiries',{method:'POST',headers:{...publicHeaders,Origin:'https://attacker.example'},body:JSON.stringify(enquiryValues)})).status,403);
assert.equal((await fetch(origin+'/api/enquiries',{method:'POST',headers:publicHeaders,body:JSON.stringify({...enquiryValues,remarks:'a'.repeat(9000)})})).status,413);
assert.equal((await fetch(origin+'/api/enquiries')).status,405);
const form=new FormData();form.append('projectId',project.id);form.append('documentType','Electricity bill');form.append('file',new File([new Uint8Array([0x25,0x50,0x44,0x46,0x2d,0x31,0x2e,0x37]),'\n%%EOF'],'demo.pdf',{type:'application/pdf'}));
const upload=await fetch(origin+'/api/files',{method:'POST',headers:{Cookie:cookies.agent,Origin:origin},body:form});const uploaded=await upload.json();assert.equal(upload.status,200,JSON.stringify(uploaded));
const file=await fetch(origin+'/api/files?id='+uploaded.id,{headers:{Cookie:cookies.company}});assert.equal(file.status,200);assert.equal(file.headers.get('content-type'),'application/pdf');
assert.equal((await fetch(origin+'/api/files?id='+uploaded.id)).status,401);
const badFile=new FormData();badFile.append('projectId',project.id);badFile.append('documentType','Other');badFile.append('file',new File(['not a PDF'],'bad.pdf',{type:'application/pdf'}));assert.equal((await fetch(origin+'/api/files',{method:'POST',headers:{Cookie:cookies.agent,Origin:origin},body:badFile})).status,400);
assert.equal((await fetch(origin+'/api/files?id='+uploaded.id,{headers:{Cookie:cookies.customer}})).status,403);
const bad=await fetch(origin+'/api/business',{method:'POST',headers:headers('agent'),body:'{bad'});assert.equal(bad.status,400);
for(const portal of ['agent','company','staff','customer']){const r=await fetch(origin+'/api/auth/logout',{method:'POST',headers:{Origin:origin,Cookie:cookies[portal]}});assert.equal(r.status,200);assert.equal((await fetch(origin+'/api/business',{headers:{Cookie:cookies[portal]}})).status,401);}
console.log('PASS: all pages, protected routes, company, staff and agent logins, wrong portal/password, CSRF, agent/company isolation, persisted requirement → company → project → agent, private upload/download, sign-out and session revocation.');
