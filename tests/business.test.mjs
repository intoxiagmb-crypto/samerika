import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {createClient} from '@libsql/client';
import {adaptDatabase} from '../lib/database.mjs';
import {migrate} from '../lib/migrations.mjs';
import { submitPublicEnquiry } from '../lib/enquiries.mjs';
import { Business } from '../lib/business.mjs';
import { DEFAULT_SETTINGS,PHASES,quoteTotal } from '../lib/policy.mjs';
const clients=[];
after(()=>{for(const client of clients)client.close();});
async function database(){const client=createClient({url:':memory:'});clients.push(client);await migrate(client);return adaptDatabase(client);}
async function setup(){const db=await database(),s=new Business(db);const users={};for(const role of ['ADMIN','PARTNER','SALES','CUSTOMER','MANAGER','TECHNICAL','VERIFIER','FINANCE']){const identity={userId:role.toLowerCase(),email:`${role.toLowerCase()}@example.test`,displayName:role};let u=await s.user(identity,role==='PARTNER'?'PARTNER':undefined);if(role!=='ADMIN'){if(role==='PARTNER'){const kyc=await s.upload(u,{projectId:'',documentType:'Partner KYC',name:'business.pdf',mime:'application/pdf',size:100,key:'kyc-test'});await s.act(users.ADMIN,'record.update',{id:kyc,status:'Verified',note:'Business verified'});}await s.act(users.ADMIN,'user.update',{id:u.id,role,status:'Active'});u=await s.user(identity);}users[role]=u;}await s.act(users.ADMIN,'settings',{...DEFAULT_SETTINGS,state:'Rajasthan',quotationTerms:'Company-approved terms'});return {db,s,u:users};}
const lead={name:'Test Customer',email:'customer@example.test',mobile:'9876543210',address:'12 Test Lane',city:'Jaipur',state:'Rajasthan',pin:'302001',capacity:3,system:'On-grid',property:'Residential',finance:'Finance',remarks:'Test installation'};
async function createProject(s,u){const leadId=await s.act(u.PARTNER,'lead.create',lead);await s.act(u.ADMIN,'lead.update',{id:leadId,status:'Assigned',assignedTo:u.SALES.id});await s.act(u.SALES,'lead.update',{id:leadId,status:'Contacted',note:'Confirmed interest',followUp:'2099-01-01'});const projectId=await s.act(u.SALES,'project.create',{leadId});await s.act(u.ADMIN,'project.update',{id:projectId,assignment:{managerId:u.MANAGER.id,technicianId:u.TECHNICAL.id,verifierId:u.VERIFIER.id}});return {leadId,projectId};}
async function completeProject(s,u,projectId){
 const survey=await s.act(u.TECHNICAL,'survey.create',{projectId,date:'2026-11-13',roofType:'RCC',area:400,shading:'No significant shading',feasibility:'Feasible',notes:'Survey complete'});await s.act(u.MANAGER,'record.update',{id:survey,status:'Approved',note:'Approved design'});
 const productId=await s.act(u.ADMIN,'product.create',{name:'Test 3 kW kit',brand:'Test brand',category:'Solar kit',capacity:3,price:180000,system:'On-grid',warranty:'As quoted'});
 const quote=await s.act(u.SALES,'quote.create',{projectId,productId,installation:10000,discount:1000,validUntil:'2099-12-31',terms:'Test terms'});await s.act(u.ADMIN,'record.update',{id:quote,status:'Approved'});await s.act(u.ADMIN,'record.update',{id:quote,status:'Sent'});await s.act(u.CUSTOMER,'record.update',{id:quote,status:'Accepted',note:'Accepted'});
 for(const documentType of DEFAULT_SETTINGS.requiredDocuments){const id=await s.upload(u.CUSTOMER,{projectId,documentType,name:'test.pdf',mime:'application/pdf',size:100,key:'test-key'});await s.act(u.VERIFIER,'record.update',{id,status:'Verified',note:'Verified against original'});}
 const approval=await s.act(u.MANAGER,'approval.create',{projectId,name:'Bank approval',reference:'BANK-TEST-1',notes:'Submitted'});await s.act(u.MANAGER,'record.update',{id:approval,status:'Approved',note:'Verified approval letter'});
 for(let phase=0;phase<PHASES.length;phase++)await s.act(u.TECHNICAL,'project.update',{id:projectId,phase,evidence:`Verified checklist ${phase+1}`});
 await s.act(u.MANAGER,'project.update',{id:projectId,quality:'Passed',note:'All quality tests pass'});await s.act(u.MANAGER,'project.update',{id:projectId,handover:true,evidence:'Signed customer handover acknowledgement'});await s.act(u.MANAGER,'project.update',{id:projectId,status:'Completed'});
 return {quote,productId};
}
test('full role-separated lifecycle: referral → installation → verified payout',async()=>{const {s,u}=await setup();const {projectId,leadId}=await createProject(s,u);await completeProject(s,u,projectId);await s.act(u.ADMIN,'settings',{...DEFAULT_SETTINGS,incentivePerKw:2000});const incentive=await s.act(u.ADMIN,'incentive.create',{projectId});await s.act(u.ADMIN,'record.update',{id:incentive,status:'Approved',note:'Eligible'});const payout=await s.act(u.FINANCE,'payout.create',{incentiveId:incentive});const evidenceId=await s.upload(u.FINANCE,{projectId,documentType:'Payment evidence',name:'receipt.pdf',mime:'application/pdf',size:100,key:'receipt-key'});await s.act(u.FINANCE,'record.update',{id:payout,status:'Processing'});await s.act(u.FINANCE,'record.update',{id:payout,status:'Paid',reference:'UTR-TEST-001',evidenceId});const partner=await s.snapshot(u.PARTNER);assert.equal(partner.records.find(r=>r.id===payout).status,'Paid');assert.equal(partner.records.find(r=>r.id===payout).amount,600000);assert.equal(partner.leads.find(l=>l.id===leadId).partner_id,u.PARTNER.id);assert.equal(partner.projects[0].status,'Completed');const admin=await s.snapshot(u.ADMIN);assert.ok(admin.audit.length>=25);assert.equal(admin.users.length,8);await assert.rejects(s.act(u.FINANCE,'payout.create',{incentiveId:incentive}),/UNIQUE/);await assert.rejects(s.act(u.ADMIN,'incentive.create',{projectId}),/UNIQUE/);await assert.rejects(s.act(u.FINANCE,'record.update',{id:payout,status:'Failed',note:'Overwrite'}),/cannot be overwritten/);});
test('duplicate email and mobile cannot silently change ownership',async()=>{const {s,u}=await setup();const first=await s.act(u.PARTNER,'lead.create',lead);await assert.rejects(s.act(u.ADMIN,'lead.create',{...lead,name:'Another name'}),/already exists/);await assert.rejects(s.act(u.ADMIN,'lead.create',{...lead,mobile:'9876543211'}),/already exists/);const stored=await s.one('SELECT * FROM leads WHERE id=?',first);assert.equal(stored.partner_id,u.PARTNER.id);assert.equal(stored.name,lead.name);});
test('pending partners cannot submit leads or escalate their own role',async()=>{const {s,u}=await setup();let p=await s.user({userId:'pending',email:'pending@example.test',displayName:'Pending'},'PARTNER');assert.equal(p.status,'Pending');await assert.rejects(s.act(p,'lead.create',lead),/permission/);await s.act(p,'profile',{name:'Pending',role:'ADMIN',company:'Test',mobile:'9999999999',city:'Jaipur',address:'Test'});p=await s.one('SELECT * FROM users WHERE id=?',p.id);assert.equal(p.role,'PARTNER');assert.equal(p.status,'Pending');await assert.rejects(s.act(p,'user.update',{id:p.id,role:'ADMIN',status:'Active'}),/permission/);});
test('object-level authorization blocks another customer and partner',async()=>{const {s,u}=await setup();const {projectId}=await createProject(s,u);const other=await s.user({userId:'other',email:'other@example.test',displayName:'Other'});assert.equal((await s.snapshot(other)).projects.length,0);await assert.rejects(s.access(other,projectId),/not assigned/);await assert.rejects(s.act(u.PARTNER,'project.update',{id:projectId,status:'Completed'}),/permission/);await assert.rejects(s.act(u.CUSTOMER,'settings',{...DEFAULT_SETTINGS}),/permission/);});
test('completion gates reject missing records and unapproved incentives',async()=>{const {s,u}=await setup();const {projectId}=await createProject(s,u);await assert.rejects(s.act(u.ADMIN,'project.update',{id:projectId,status:'Completed'}),/survey/);await assert.rejects(s.act(u.ADMIN,'incentive.create',{projectId}),/Complete the project/);await assert.rejects(s.act(u.FINANCE,'payout.create',{incentiveId:'missing'}),/approved incentives/);await assert.rejects(s.act(u.TECHNICAL,'project.update',{id:projectId,phase:3,evidence:'Skipped phases'}),/previous installation phase/);});
test('removed quality checks no longer block completion while document verification remains required',async()=>{const {s,u}=await setup();const {projectId}=await createProject(s,u);await completeProject(s,u,projectId);
 const p=await s.one('SELECT * FROM projects WHERE id=?',projectId);await s.run('UPDATE projects SET status=?,data=? WHERE id=?','Installation',JSON.stringify({...p.data,quality:'Failed'}),projectId);
 const doc=await s.one("SELECT * FROM records WHERE kind='document' AND project_id=?",projectId);await s.act(u.VERIFIER,'record.update',{id:doc.id,status:'Rejected',note:'Unreadable document'});await assert.rejects(s.act(u.MANAGER,'project.update',{id:projectId,status:'Completed'}),/Verify the required document/);
 await s.act(u.VERIFIER,'record.update',{id:doc.id,status:'Verified'});await s.act(u.MANAGER,'project.update',{id:projectId,status:'Completed'});
 assert.equal((await s.one('SELECT * FROM projects WHERE id=?',projectId)).status,'Completed');});
test('cash projects have no bank prerequisite; finance cannot remove bank approval',async()=>{const {s,u}=await setup();const id=await s.act(u.ADMIN,'lead.create',{...lead,finance:'Cash'});const projectId=await s.act(u.ADMIN,'project.create',{leadId:id});const p=await s.one('SELECT * FROM projects WHERE id=?',projectId);assert.deepEqual(p.data.requiredApprovals,[]);await assert.rejects(s.act(u.ADMIN,'approval.create',{projectId,name:'Bank approval',reference:'invalid'}),/Cash projects/);});
test('quotation totals use integer minor units and reject invalid inputs',()=>{assert.deepEqual(quoteTotal({unitPrice:60000,capacity:3,installation:10000,discount:1000,taxRate:5}),{subtotal:18900000,tax:945000,total:19845000});assert.throws(()=>quoteTotal({unitPrice:100,capacity:1,discount:1000}),/Discount/);assert.throws(()=>quoteTotal({unitPrice:NaN,capacity:3}),/valid positive/);});
test('quote snapshots survive catalogue changes and rejected quote is not accepted',async()=>{const {s,u}=await setup();const {projectId}=await createProject(s,u);const productId=await s.act(u.ADMIN,'product.create',{name:'Kit',brand:'Test',category:'Solar kit',capacity:3,price:150000,system:'On-grid',warranty:'Test'});const id=await s.act(u.ADMIN,'quote.create',{projectId,productId,validUntil:'2099-12-31'});const before=await s.one('SELECT * FROM records WHERE id=?',id);await s.act(u.ADMIN,'record.update',{id:productId,status:'Archived'});assert.equal((await s.one('SELECT * FROM records WHERE id=?',id)).amount,before.amount);assert.equal((await s.snapshot(u.CUSTOMER)).records.some(r=>r.id===id),false);await s.act(u.ADMIN,'record.update',{id,status:'Approved'});await s.act(u.ADMIN,'record.update',{id,status:'Sent'});await s.act(u.CUSTOMER,'record.update',{id,status:'Rejected',note:'Revise scope'});await assert.rejects(s.act(u.CUSTOMER,'record.update',{id,status:'Accepted'}),/Only a sent quotation/);});
test('stale project updates are rejected and cancelled projects remain read-only',async()=>{const {s,u}=await setup();const {projectId}=await createProject(s,u);const p=await s.one('SELECT * FROM projects WHERE id=?',projectId);await s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,status:'Delayed',note:'Site access unavailable'});await assert.rejects(s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,status:'Installation'}),/Project changed/);await s.act(u.MANAGER,'project.update',{id:projectId,status:'Cancelled',note:'Customer cancelled'});await assert.rejects(s.act(u.ADMIN,'project.update',{id:projectId,status:'Survey'}),/read-only/);});
test('private files deny cross-customer and partner access to others uploads',async()=>{const {s,u}=await setup();const {projectId}=await createProject(s,u);const doc=await s.upload(u.CUSTOMER,{projectId,documentType:'Electricity bill',name:'bill.pdf',mime:'application/pdf',size:10,key:'secret-key'});await assert.rejects(s.fileAccess(u.PARTNER,doc),/only download documents they uploaded/);const other=await s.user({userId:'other',email:'other@example.test',displayName:'Other'});await assert.rejects(s.fileAccess(other,doc),/not assigned/);assert.equal((await s.fileAccess(u.CUSTOMER,doc)).data.fileKey,'secret-key');assert.equal((await s.snapshot(u.PARTNER)).records.find(r=>r.id===doc).data.fileKey,undefined);});
test('payment evidence is mandatory and failed payout can be retried',async()=>{const {s,u}=await setup();const {projectId}=await createProject(s,u);await completeProject(s,u,projectId);await s.act(u.ADMIN,'settings',{...DEFAULT_SETTINGS,incentivePerKw:1000});const incentive=await s.act(u.ADMIN,'incentive.create',{projectId});await s.act(u.ADMIN,'record.update',{id:incentive,status:'Approved'});const payout=await s.act(u.FINANCE,'payout.create',{incentiveId:incentive});await assert.rejects(s.act(u.FINANCE,'record.update',{id:payout,status:'Paid',reference:'UTR'}),/evidence/);await s.act(u.FINANCE,'record.update',{id:payout,status:'Failed',note:'Bank rejected transfer'});assert.equal((await s.one('SELECT * FROM records WHERE id=?',payout)).status,'Failed');await s.act(u.FINANCE,'record.update',{id:payout,status:'Processing'});assert.equal((await s.one('SELECT * FROM records WHERE id=?',payout)).status,'Processing');});
test('rate limits are persistent and admin cannot revoke own access',async()=>{const {s,u}=await setup();await assert.rejects(s.act(u.ADMIN,'user.update',{id:u.ADMIN.id,role:'CUSTOMER',status:'Active'}),/own administrator/);for(let i=0;i<60;i++)await s.limit('test-rate');await assert.rejects(s.limit('test-rate'),/Too many requests/);});

test('partner activation requires verified KYC and KYC remains private',async()=>{const {s,u}=await setup();const p=await s.user({userId:'new-partner',email:'new-partner@example.test',displayName:'New partner'},'PARTNER');await assert.rejects(s.act(u.ADMIN,'user.update',{id:p.id,role:'PARTNER',status:'Active'}),/KYC/);const id=await s.upload(p,{projectId:'',documentType:'Partner KYC',name:'business.pdf',mime:'application/pdf',size:100,key:'private-kyc'});await assert.rejects(s.fileAccess(u.CUSTOMER,id),/KYC access denied/);await s.act(u.ADMIN,'record.update',{id,status:'Verified',note:'Verified company document'});await s.act(u.ADMIN,'user.update',{id:p.id,role:'PARTNER',status:'Active'});assert.equal((await s.one('SELECT * FROM users WHERE id=?',p.id)).status,'Active');});

test('customer requirements preserve energy usage and roof details and reject negative values',async()=>{const {s,u}=await setup();const id=await s.act(u.PARTNER,'lead.create',{...lead,monthlyBill:'4500',roofArea:'600'});const stored=await s.one('SELECT * FROM leads WHERE id=?',id);assert.equal(stored.data.monthlyBill,4500);assert.equal(stored.data.roofArea,600);await assert.rejects(s.act(u.PARTNER,'lead.create',{...lead,mobile:'9876543211',email:'second@example.test',monthlyBill:-1}),/greater than or equal to 0/);});

test('customer and multiple catalogue items create a quote matching the supplied mixed-GST example',async()=>{
 const {s,u}=await setup();const customerId=await s.act(u.ADMIN,'lead.create',lead);
 const productIds=[];
 for(const p of [{name:'630 W module',price:10330,taxRate:5,quantity:18},{name:'200AH battery',price:16780,taxRate:5,hsn:'85072000',quantity:10},{name:'Installation and labour',price:8000,taxRate:18,unit:'kW',quantity:10}]){
  productIds.push(await s.act(u.ADMIN,'product.create',{brand:'Test',category:'Services',capacity:1,system:'On-grid',warranty:'Manufacturer terms',...p}));
 }
 const id=await s.act(u.ADMIN,'quote.create',{customerId,items:productIds.map((productId,i)=>({productId,quantity:[18,10,10][i],unitPrice:1,taxRate:0})),validUntil:'2099-12-31',taxMode:'CGST_SGST'});
 const q=await s.one('SELECT * FROM records WHERE id=?',id);
 assert.equal(q.amount,46582700);assert.equal(q.data.subtotal,43374000);assert.equal(q.data.tax,3208700);
 assert.deepEqual(q.data.items.map(i=>i.tax),[929700,839000,1440000]);
 assert.equal(q.data.customerDetails.mobile,lead.mobile);assert.equal(q.data.items[1].hsn,'85072000');
 assert.equal((await s.one('SELECT * FROM leads WHERE id=?',customerId)).status,'Converted');
 assert.equal((await s.one('SELECT * FROM projects WHERE id=?',q.project_id)).status,'Quotation');
 const product=await s.one('SELECT * FROM records WHERE id=?',productIds[0]);
 await s.act(u.ADMIN,'product.update',{...product.data,id:product.id,version:product.version,price:11000,taxRate:18});
 assert.equal((await s.one('SELECT * FROM records WHERE id=?',id)).data.items[0].unitPrice,1033000);
 const second=await s.act(u.ADMIN,'quote.create',{customerId,items:[{productId:product.id,quantity:1}],validUntil:'2099-12-31'});
 assert.equal((await s.one('SELECT * FROM records WHERE id=?',second)).project_id,q.project_id);
 assert.equal((await s.all('SELECT * FROM projects')).length,1);
});

test('item quotations validate before creating a project and enforce customer access',async()=>{
 const {s,u}=await setup();const customerId=await s.act(u.ADMIN,'lead.create',lead);
 const productId=await s.act(u.ADMIN,'product.create',{name:'Panel',brand:'Test',category:'Solar panel',capacity:1,price:100,taxRate:5,system:'On-grid',warranty:'Test'});
 const draft={customerId,items:[{productId,quantity:1}],validUntil:'2099-12-31'};
 await assert.rejects(s.act(u.SALES,'quote.create',draft),/not assigned/);
 await assert.rejects(s.act(u.CUSTOMER,'quote.create',draft),/permission/);
 for(const patch of [{items:[]},{items:[{productId,quantity:0}]},{items:[{productId,quantity:0.0001}]},{items:[{productId,quantity:1},{productId,quantity:1}]},{discount:101},{validUntil:'2099-02-30'},{items:[{productId:'missing',quantity:1}]}])await assert.rejects(s.act(u.ADMIN,'quote.create',{...draft,...patch}));
 assert.equal((await s.all('SELECT * FROM projects')).length,0);
 assert.equal((await s.one('SELECT * FROM leads WHERE id=?',customerId)).status,'New');
 await s.act(u.ADMIN,'record.update',{id:productId,status:'Archived'});
 await assert.rejects(s.act(u.ADMIN,'quote.create',draft),/unavailable/);
});

const publicEnquiry={name:'Website Customer',mobile:'9876501234',email:'website@example.test',city:'Jaipur',pin:'302001',property:'Residential',remarks:'Interested in rooftop solar'};
test('public enquiry creates a new company lead without creating accounts or trusting ownership fields',async()=>{
 const {s,db,u}=await setup();const accounts=(await s.all('SELECT * FROM users')).length;
 assert.deepEqual(await submitPublicEnquiry(db,{...publicEnquiry,owner_id:u.PARTNER.id,partner_id:u.PARTNER.id,status:'Approved',capacity:99}),{ok:true});
 const l=await s.one('SELECT * FROM leads WHERE mobile=?',publicEnquiry.mobile);
 assert.equal(l.status,'New');assert.equal(l.data.source,'Website');assert.ok([u.SALES.id,u.MANAGER.id].includes(l.owner_id));assert.equal(l.partner_id,null);assert.equal(l.assigned_to,null);assert.equal(l.data.capacity,null);assert.equal(l.data.qualificationRequired,true);
 assert.equal((await s.all('SELECT * FROM users')).length,accounts);
 const snap=await s.snapshot(u.ADMIN);assert.equal(snap.notifications.some(n=>n.entity_id===l.id),false);assert.equal(snap.audit.find(a=>a.entity_id===l.id).actor_name,'Website visitor');
 assert.equal((await s.snapshot(u.PARTNER)).leads.length,0);assert.equal((await s.snapshot(u.SALES)).leads.length,1);
 for(const role of ['SALES','MANAGER'])assert.ok((await s.snapshot(u[role])).notifications.some(n=>n.entity_id===l.id));
 for(const role of ['TECHNICAL','VERIFIER','FINANCE'])assert.equal((await s.snapshot(u[role])).leads.length,0);
 await assert.rejects(s.act(u.ADMIN,'project.create',{leadId:l.id}),/Confirm site details/);
 await s.act(u.SALES,'lead.update',{id:l.id,status:'Qualified',qualification:{address:'12 Solar Lane',city:l.data.city,state:'Rajasthan',pin:l.data.pin,capacity:3,system:'On-grid',finance:'Cash'}});
 const projectId=await s.act(u.SALES,'project.create',{leadId:l.id});assert.equal((await s.one('SELECT * FROM projects WHERE id=?',projectId)).data.capacity,3);
});
test('public duplicates and concurrent retries preserve original lead, referral and notifications',async()=>{
 const {s,db,u}=await setup();const leadId=await s.act(u.PARTNER,'lead.create',lead);
 const original=await s.one('SELECT * FROM leads WHERE id=?',leadId);
 assert.deepEqual(await submitPublicEnquiry(db,{...publicEnquiry,mobile:lead.mobile}),{ok:true});
 assert.deepEqual(await submitPublicEnquiry(db,{...publicEnquiry,email:lead.email}),{ok:true});
 assert.deepEqual(await s.one('SELECT * FROM leads WHERE id=?',leadId),original);
 await Promise.all([submitPublicEnquiry(db,publicEnquiry),submitPublicEnquiry(db,publicEnquiry)]);
 assert.equal((await s.all('SELECT * FROM leads WHERE mobile=?',publicEnquiry.mobile)).length,1);
 assert.equal((await s.all("SELECT * FROM audit WHERE action='enquiry.received'")).length,1);
});
test('public enquiry validates fields, normalizes contacts and rejects spam before creating leads',async()=>{
 const {s,db}=await setup();
 for(const patch of [{name:' '},{mobile:'123'},{mobile:'1234567890'},{email:'invalid'},{pin:'000000'},{city:''},{property:'Other'},{website:'spam'},{remarks:'x'.repeat(2001)}])await assert.rejects(submitPublicEnquiry(db,{...publicEnquiry,...patch}));
 assert.equal((await s.all('SELECT * FROM leads')).length,0);
 await submitPublicEnquiry(db,{...publicEnquiry,mobile:'+91 9876501234',email:' WEBSITE@EXAMPLE.TEST '});
 assert.equal((await s.one('SELECT * FROM leads WHERE mobile=?',publicEnquiry.mobile)).customer_email,publicEnquiry.email);
 for(let i=0;i<4;i++)await submitPublicEnquiry(db,publicEnquiry);
 await assert.rejects(submitPublicEnquiry(db,publicEnquiry),e=>e.status===429);
});
test('public enquiry reports unavailable intake when no active intake staff exists',async()=>{
 const db=await database();await assert.rejects(submitPublicEnquiry(db,publicEnquiry),e=>e.status===503);
 const s=new Business(db);assert.equal((await s.all('SELECT * FROM leads')).length,0);
});

test('inbound enquiries notify only active intake staff and keep agent referrals intact',async()=>{
 const {s,db,u}=await setup();
 const id=await s.act(u.PARTNER,'lead.create',lead);
 const stored=await s.one('SELECT * FROM leads WHERE id=?',id);assert.equal(stored.partner_id,u.PARTNER.id);
 for(const role of ['SALES','MANAGER']){const snap=await s.snapshot(u[role]);assert.ok(snap.leads.some(l=>l.id===id));assert.ok(snap.notifications.some(n=>n.entity_id===id));}
 for(const role of ['ADMIN','PARTNER','CUSTOMER','TECHNICAL','VERIFIER','FINANCE'])assert.equal((await s.snapshot(u[role])).notifications.some(n=>n.entity_id===id),false);
 await s.act(u.ADMIN,'lead.update',{id,status:'Assigned',assignedTo:u.SALES.id});
 assert.equal((await s.snapshot(u.MANAGER)).leads.some(l=>l.id===id),false);
 assert.ok((await s.snapshot(u.SALES)).leads.some(l=>l.id===id));
 await s.run("UPDATE users SET status='Suspended' WHERE role IN ('SALES','MANAGER')");
 await assert.rejects(submitPublicEnquiry(db,publicEnquiry),e=>e.status===503);
 await assert.rejects(s.act(u.PARTNER,'lead.create',{...lead,mobile:'9876500001',email:'no-staff@example.test'}),e=>e.status===503);
 assert.equal((await s.all('SELECT * FROM leads')).length,1);
});
test('suspended staff receive no enquiry and old unassigned website leads reach the staff inbox',async()=>{
 const {s,db,u}=await setup();await s.run("UPDATE users SET status='Suspended' WHERE id=?",u.MANAGER.id);
 await submitPublicEnquiry(db,publicEnquiry);const l=await s.one('SELECT * FROM leads WHERE mobile=?',publicEnquiry.mobile);
 assert.deepEqual((await s.all('SELECT user_id FROM notifications WHERE entity_id=?',l.id)).map(n=>n.user_id),[u.SALES.id]);
 await s.run('UPDATE leads SET owner_id=? WHERE id=?',u.ADMIN.id,l.id);
 assert.ok((await s.snapshot(u.SALES)).leads.some(row=>row.id===l.id));
});

test('application tracking persists staff updates, protects roles and rejects stale changes',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 let p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 const patch={id:projectId,version:p.version,stepId:'site_survey',status:'Completed',eventDate:'2026-01-01',reference:'REG-ACK-TEST',applicationNumber:'APP-TEST-001'};
 for(const role of ['PARTNER','CUSTOMER','TECHNICAL','VERIFIER','FINANCE'])await assert.rejects(s.act(u[role],'project.tracking',patch),e=>e.status===403);
 await s.act(u.SALES,'project.tracking',patch);
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 assert.equal(p.data.tracking.applicationNumber,'APP-TEST-001');assert.equal(p.data.tracking.steps.site_survey.status,'Completed');
 assert.equal(p.status,'Survey','Tracking does not override verified project completion');
 assert.ok(p.data.phases.every(phase=>phase.status==='Pending'));
 for(const role of ['ADMIN','PARTNER','CUSTOMER','SALES','MANAGER'])assert.equal((await s.snapshot(u[role])).projects.find(row=>row.id===projectId).data.tracking.applicationNumber,'APP-TEST-001');
 await assert.rejects(s.act(u.SALES,'project.tracking',patch),e=>e.status===409);
 assert.equal((await s.all("SELECT * FROM audit WHERE action='project.tracking'")).length,1);
 const other=await s.user({userId:'other-sales',email:'other-sales@example.test',displayName:'Other sales'});
 await s.act(u.ADMIN,'user.update',{id:other.id,role:'SALES',status:'Active'});
 await assert.rejects(s.act({...other,role:'SALES'},'project.tracking',{...patch,version:p.version}),e=>e.status===403);
 await s.act(u.MANAGER,'project.tracking',{id:projectId,version:p.version,stepId:'quotation',status:'In Progress',eventDate:'2026-01-02',note:'Application submitted'});
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await s.act(u.MANAGER,'project.tracking',{id:projectId,version:p.version,stepId:'quotation',status:'Hold / Rejected',eventDate:'2026-01-03',note:'Customer requested revised pricing',updatedBy:'Forged name',updatedById:'forged'});
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 assert.equal(p.data.tracking.steps.quotation.updatedById,u.MANAGER.id);
 assert.equal(p.data.tracking.steps.quotation.updatedBy,u.MANAGER.name);
 assert.equal(p.data.tracking.steps.quotation.history.length,2);
 assert.equal(p.data.tracking.steps.quotation.history[0].status,'In Progress');
 assert.equal((await s.snapshot(u.PARTNER)).projects.find(row=>row.id===projectId).data.tracking.steps.quotation.note,'Customer requested revised pricing');
 await assert.rejects(s.act(u.ADMIN,'project.tracking',{id:projectId,version:p.version,stepId:'order_confirmation',status:'Completed',eventDate:'2026-01-04',note:'Cannot skip hold'}),/earlier tracking stages/);
 await s.run("UPDATE projects SET status='Completed' WHERE id=?",projectId);
 await s.act(u.ADMIN,'project.tracking',{id:projectId,version:p.version,applicationNumber:'APP-TEST-CORRECTED'});
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);assert.equal(p.status,'Completed');
 await s.run("UPDATE projects SET status='Cancelled' WHERE id=?",projectId);
 await assert.rejects(s.act(u.ADMIN,'project.tracking',{id:projectId,version:p.version,applicationNumber:'CANCELLED'}),/read-only/);
});

test('quotation terms and GST are computed server-side, resisting staff and admin payload overrides',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 const productId=await s.act(u.ADMIN,'product.create',{name:'Panel',brand:'Test',category:'Solar panel',capacity:1,price:100,taxRate:5,system:'On-grid',warranty:'Test'});
 const values={projectId,items:[{productId,quantity:1}],validUntil:'2099-12-31',terms:'Injected staff terms',taxMode:'IGST'};
 const id=await s.act(u.SALES,'quote.create',values);
 const q=await s.one('SELECT * FROM records WHERE id=?',id);
 assert.equal(q.data.terms,'Company-approved terms');assert.equal(q.data.taxMode,'CGST_SGST');assert.equal(q.data.placeOfSupply,'Rajasthan');
 await assert.rejects(s.act(u.SALES,'settings',{...DEFAULT_SETTINGS,quotationTerms:'Tampered'}),/permission/);
 await assert.rejects(s.act(u.PARTNER,'quote.create',values),/permission/);
 await s.act(u.ADMIN,'settings',{...DEFAULT_SETTINGS,state:'Odisha',quotationTerms:'Updated admin terms'});
 const next=await s.act(u.ADMIN,'quote.create',{...values,terms:'Per-quote override',taxMode:'CGST_SGST'});
 const nextQuote=await s.one('SELECT * FROM records WHERE id=?',next);
 assert.equal(nextQuote.data.terms,'Updated admin terms');assert.equal(nextQuote.data.taxMode,'IGST');
 assert.equal((await s.one('SELECT * FROM records WHERE id=?',id)).data.terms,'Company-approved terms');
 await s.act(u.ADMIN,'settings',{...DEFAULT_SETTINGS,state:''});
 await assert.rejects(s.act(u.ADMIN,'quote.create',values),/company state/);
});

test('quotation links require publication and project access, omit internal fields, expire and revoke',async()=>{
 const {createQuotationShare,getSharedQuotation,revokeQuotationShares}=await import('../lib/quotation-sharing.mjs');
 const {db,s,u}=await setup();const {projectId}=await createProject(s,u);
 const productId=await s.act(u.ADMIN,'product.create',{name:'Panel',brand:'Test',category:'Solar panel',capacity:1,price:100,taxRate:5,system:'On-grid',warranty:'Test'});
 const id=await s.act(u.SALES,'quote.create',{projectId,items:[{productId,quantity:1}],validUntil:'2099-12-31'});
 await assert.rejects(createQuotationShare(db,u.SALES,id),/approve and publish/);
 await s.act(u.ADMIN,'record.update',{id,status:'Approved'});
 await assert.rejects(createQuotationShare(db,u.ADMIN,id),/approve and publish/);
 await s.act(u.ADMIN,'record.update',{id,status:'Sent',note:'Private approval note'});
 const stranger={...u.SALES,id:'unassigned-sales'};
 await assert.rejects(createQuotationShare(db,stranger,id),/not assigned/);
 await assert.rejects(createQuotationShare(db,u.CUSTOMER,id),/permission/);
 const now=Date.now();const share=await createQuotationShare(db,u.SALES,id,now);const token=share.path.split('/').pop();
 const publicQuote=await getSharedQuotation(db,token,now);
 assert.equal(publicQuote.id,id);assert.equal(publicQuote.data.terms,'Company-approved terms');
 assert.equal(publicQuote.project_id,undefined);assert.equal(publicQuote.owner_id,undefined);assert.equal(publicQuote.data.remarks,undefined);
 assert.equal(JSON.stringify(publicQuote).includes('Private approval note'),false);
 assert.equal(JSON.stringify((await s.all('SELECT * FROM settings'))).includes(token),false);
 assert.equal(await getSharedQuotation(db,token,share.expiresAt),null);
 assert.equal(await getSharedQuotation(db,'a'.repeat(64)),null);
 assert.equal(await getSharedQuotation(db,'malformed'),null);
 await assert.rejects(revokeQuotationShares(db,u.SALES,id),/permission/);
 await revokeQuotationShares(db,u.ADMIN,id);assert.equal(await getSharedQuotation(db,token),null);
 const second=await createQuotationShare(db,u.PARTNER,id);
 await s.act(u.CUSTOMER,'record.update',{id,status:'Rejected',note:'Needs revision'});
 assert.equal(await getSharedQuotation(db,second.path.split('/').pop()),null);
});

test('inline installation statuses save history, enforce order and preserve completion checks', async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 const get=()=>s.one('SELECT * FROM projects WHERE id=?',projectId);
 const phase=async(index,status,evidence='')=>{const p=await get();return s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,phase:index,phaseStatus:status,evidence});};
 await phase(0,'Processing');let p=await get();assert.equal(p.data.phases[0].status,'Processing');assert.equal(p.status,'Installation');
 await assert.rejects(phase(1,'Processing'),/previous installation phase/);
 await phase(0,'Completed');await phase(1,'Processing');
 await assert.rejects(phase(0,'Pending'),/Reset later installation phases/);
 await phase(1,'Pending');await phase(0,'Pending');
 assert.deepEqual((await get()).data.phases[0].history.map(entry=>entry.status),['Processing','Completed','Pending']);
 for(let i=0;i<6;i++)await phase(i,'Completed');
 await assert.rejects(phase(6,'Completed'),/customer acknowledgement/);
 p=await get();await assert.rejects(s.act(u.TECHNICAL,'project.update',{id:projectId,version:p.version,phase:6,phaseStatus:'Completed',evidence:'Report'}),e=>e.status===403);
 await phase(6,'Completed','Customer signed HANDOVER-1');
 p=await get();assert.equal(p.data.handover,true);assert.equal(p.data.handoverEvidence,'Customer signed HANDOVER-1');
 await assert.rejects(s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,status:'Completed'}),/survey/);
 await phase(6,'Pending');assert.equal((await get()).data.handover,false);
});

test('quick tracking records the India date and employee without requiring another form',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 const quick=async(stepId,status)=>{const p=await s.one('SELECT * FROM projects WHERE id=?',projectId);return s.act(u.SALES,'project.tracking',{id:projectId,version:p.version,stepId,status,quick:true,eventDate:'2000-01-01',updatedBy:'Forged'});};
 await quick('site_survey','In Progress');await quick('site_survey','Completed');
 const p=await s.one('SELECT * FROM projects WHERE id=?',projectId);const step=p.data.tracking.steps.site_survey;
 assert.equal(step.updatedBy,'SALES');assert.equal(step.eventDate,new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'}));assert.equal(step.note,'');assert.equal(step.history.length,2);
 await assert.rejects(quick('registration','Completed'),/earlier tracking stages/);
 await quick('quotation','Completed');await quick('order_confirmation','Completed');await quick('registration','Completed');
 await assert.rejects(quick('installation','Completed'),/installation phases/);
});

test('inline approval saves one real approval with reference, history and stale-update protection',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 const p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 const first={id:projectId,version:p.version,name:'Bank approval',status:'Processing'};
 for(const role of ['CUSTOMER','PARTNER','SALES','TECHNICAL','VERIFIER','FINANCE'])await assert.rejects(s.act(u[role],'project.approval',first),e=>e.status===403);
 const id=await s.act(u.MANAGER,'project.approval',first);
 await assert.rejects(s.act(u.MANAGER,'project.approval',first),e=>e.status===409);
 const fresh=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await assert.rejects(s.act(u.MANAGER,'project.approval',{...first,version:fresh.version,status:'Approved'}),/approval reference/);
 await s.act(u.MANAGER,'project.approval',{...first,version:fresh.version,status:'Approved',reference:'BANK-ACK-1'});
 const approval=await s.one('SELECT * FROM records WHERE id=?',id);assert.equal(approval.status,'Approved');assert.equal(approval.data.reference,'BANK-ACK-1');assert.equal(approval.data.history.length,2);
 assert.equal((await s.all("SELECT * FROM records WHERE project_id=? AND kind='approval'",projectId)).length,1);
 const current=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await assert.rejects(s.act(u.MANAGER,'project.approval',{...first,version:current.version,name:'Invented approval'}),/required project approval/);
 await s.act(u.MANAGER,'project.update',{id:projectId,version:current.version,status:'Cancelled',note:'Cancelled by customer'});
 const cancelled=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await assert.rejects(s.act(u.MANAGER,'project.approval',{...first,version:cancelled.version}),/read-only/);
});

test('uploaded documents can move between pending, processing and completed with reviewer permissions',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 const id=await s.upload(u.MANAGER,{projectId,documentType:'Electricity bill',name:'bill.pdf',mime:'application/pdf',size:20,key:'bill-key'});
 await assert.rejects(s.act(u.MANAGER,'record.update',{id,status:'Verified'}),e=>e.status===403);
 for(const status of ['Under Review','Verified','Pending']){const r=await s.one('SELECT * FROM records WHERE id=?',id);await s.act(u.VERIFIER,'record.update',{id,version:r.version,status});assert.equal((await s.one('SELECT * FROM records WHERE id=?',id)).status,status);}
});

test('customer profile stays editable in every lead status without changing workflow or ownership',async()=>{
 const {s,u}=await setup();const {leadId,projectId}=await createProject(s,u);
 const originalProject=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 for(const status of ['New','Assigned','Contacted','Interested','Qualified','Site Survey','Quotation','Converted','Follow-up Required','On Hold','Lost','Rejected','Duplicate','Cancelled']){
  await s.run('UPDATE leads SET status=? WHERE id=?',status,leadId);
  const before=await s.one('SELECT * FROM leads WHERE id=?',leadId);
  await s.act(u.SALES,'lead.profile',{id:leadId,version:before.version,name:`Customer ${status}`,address:'Updated installation address',status:'New',assignedTo:u.ADMIN.id,partner_id:null,capacity:99,qualificationRequired:false});
  const after=await s.one('SELECT * FROM leads WHERE id=?',leadId);
  assert.equal(after.status,status);assert.equal(after.assigned_to,before.assigned_to);assert.equal(after.partner_id,before.partner_id);assert.equal(after.owner_id,before.owner_id);
  assert.equal(after.data.capacity,before.data.capacity);assert.equal(after.data.name,after.name);assert.equal(after.version,before.version+1);
  const project=await s.one('SELECT * FROM projects WHERE id=?',projectId);
  assert.equal(project.data.name,after.name);assert.equal(project.data.address,'Updated installation address');
  assert.equal(project.status,originalProject.status);assert.deepEqual(project.data.phases,originalProject.data.phases);
 }
 assert.equal((await s.all("SELECT * FROM audit WHERE entity_id=? AND action='lead.profile'",leadId)).length,14);
});

test('profile corrections preserve quote snapshots and customer account access and reject stale saves',async()=>{
 const {s,u}=await setup();const {leadId,projectId}=await createProject(s,u);
 const oldQuote=await s.createRecord(u.ADMIN,'quote',projectId,'Draft',{customer:lead.name,customerDetails:{name:lead.name,email:lead.email}});
 const before=await s.one('SELECT * FROM leads WHERE id=?',leadId);
 await s.act(u.MANAGER,'lead.profile',{id:leadId,version:before.version,name:'Corrected Customer',mobile:'9876543222',email:'  corrected@example.test  ',city:'Udaipur',state:'Rajasthan',pin:'313001'});
 const after=await s.one('SELECT * FROM leads WHERE id=?',leadId);
 assert.equal(after.customer_email,'corrected@example.test');assert.equal(after.data.email,after.customer_email);assert.equal(after.mobile,'9876543222');assert.equal(after.data.mobile,after.mobile);
 assert.equal((await s.one('SELECT * FROM records WHERE id=?',oldQuote)).data.customer,lead.name);
 assert.ok((await s.snapshot(u.CUSTOMER)).leads.some(item=>item.id===leadId));
 const other=await s.user({userId:'corrected-contact',email:'corrected@example.test',displayName:'Different account'});
 await assert.rejects(s.access(other,projectId),e=>e.status===403);
 const savedProject=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await assert.rejects(s.act(u.MANAGER,'lead.profile',{id:leadId,version:before.version,name:'Stale edit'}),e=>e.status===409);
 assert.deepEqual(await s.one('SELECT * FROM projects WHERE id=?',projectId),savedProject);
});

test('customer profile enforces assignment, field validation and duplicate contact checks',async()=>{
 const {s,u}=await setup();const {leadId}=await createProject(s,u);
 const before=await s.one('SELECT * FROM leads WHERE id=?',leadId);
 const patch={id:leadId,version:before.version,name:'Updated customer'};
 for(const role of ['CUSTOMER','PARTNER','TECHNICAL','VERIFIER','FINANCE'])await assert.rejects(s.act(u[role],'lead.profile',patch),e=>e.status===403);
 await assert.rejects(s.act({...u.SALES,id:'unassigned-sales'},'lead.profile',patch),e=>e.status===403);
 for(const values of [{mobile:'123'},{email:'invalid'},{pin:'123'},{name:''},{monthlyBill:-1},{address:''}])await assert.rejects(s.act(u.ADMIN,'lead.profile',{...patch,...values}));
 await s.act(u.ADMIN,'lead.create',{...lead,name:'Other customer',mobile:'9876543333',email:'other@example.test'});
 for(const values of [{mobile:'9876543333'},{email:'other@example.test'}])await assert.rejects(s.act(u.ADMIN,'lead.profile',{...patch,...values}),e=>e.status===409);
 assert.deepEqual(await s.one('SELECT * FROM leads WHERE id=?',leadId),before);
});

test('editing a website contact does not require missing survey details or qualify the lead',async()=>{
 const {s,db,u}=await setup();await submitPublicEnquiry(db,{...publicEnquiry,email:'',pin:''});
 const before=await s.one('SELECT * FROM leads WHERE mobile=?',publicEnquiry.mobile);
 await s.act(u.SALES,'lead.profile',{id:before.id,version:before.version,name:'Corrected website name',email:'',address:'',state:'',pin:''});
 const after=await s.one('SELECT * FROM leads WHERE id=?',before.id);
 assert.equal(after.name,'Corrected website name');assert.equal(after.customer_email,'');assert.equal(after.data.qualificationRequired,true);assert.equal(after.data.capacity,null);
 await assert.rejects(s.act(u.SALES,'project.create',{leadId:before.id}),/Confirm site details/);
});

test('customer bill and application numbers save as text and carry into the converted project',async()=>{
 const {s,u}=await setup();
 const leadId=await s.act(u.ADMIN,'lead.create',{...lead,customerBillNumber:' 0012/BILL-9 ',applicationNumber:' 0007/APP-5 '});
 const saved=await s.one('SELECT * FROM leads WHERE id=?',leadId);
 assert.equal(saved.data.customerBillNumber,'0012/BILL-9');assert.equal(saved.data.applicationNumber,'0007/APP-5');
 const projectId=await s.act(u.ADMIN,'project.create',{leadId});
 const project=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 assert.equal(project.data.customerBillNumber,'0012/BILL-9');assert.equal(project.data.tracking.applicationNumber,'0007/APP-5');
});

test('profile and tracking application numbers stay synchronized without replacing stage history',async()=>{
 const {s,u}=await setup();const {leadId,projectId}=await createProject(s,u);
 let project=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await s.act(u.ADMIN,'project.tracking',{id:projectId,version:project.version,stepId:'site_survey',status:'Completed',eventDate:'2026-01-01',note:'Survey recorded'});
 const before=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 let customer=await s.one('SELECT * FROM leads WHERE id=?',leadId);
 await s.act(u.SALES,'lead.profile',{id:leadId,version:customer.version,customerBillNumber:'00012345',applicationNumber:'APP-NEW'});
 project=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 assert.equal(project.data.customerBillNumber,'00012345');assert.equal(project.data.tracking.applicationNumber,'APP-NEW');assert.deepEqual(project.data.tracking.steps,before.data.tracking.steps);
 customer=await s.one('SELECT * FROM leads WHERE id=?',leadId);
 await s.act(u.MANAGER,'project.tracking',{id:projectId,version:project.version,applicationNumber:'APP-CORRECTED'});
 let updated=await s.one('SELECT * FROM leads WHERE id=?',leadId);
 assert.equal(updated.data.applicationNumber,'APP-CORRECTED');assert.equal(updated.version,customer.version+1);
 await assert.rejects(s.act(u.SALES,'lead.profile',{id:leadId,version:customer.version,applicationNumber:'STALE'}),e=>e.status===409);
 await s.act(u.SALES,'lead.profile',{id:leadId,version:updated.version,remarks:'Contact confirmed'});
 assert.equal((await s.one('SELECT * FROM projects WHERE id=?',projectId)).data.tracking.applicationNumber,'APP-CORRECTED');
 updated=await s.one('SELECT * FROM leads WHERE id=?',leadId);
 await assert.rejects(s.act(u.SALES,'lead.profile',{id:leadId,version:updated.version,customerBillNumber:'1'.repeat(101)}));
 await s.act(u.SALES,'lead.profile',{id:leadId,version:updated.version,customerBillNumber:'',applicationNumber:''});
 project=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 assert.equal(project.data.customerBillNumber,'');assert.equal(project.data.tracking.applicationNumber,'');assert.deepEqual(project.data.tracking.steps,before.data.tracking.steps);
});

test('bank approval Cash updates payment preference, keeps other approvals and can return to finance',async()=>{
 const {s,u}=await setup();const {leadId,projectId}=await createProject(s,u);
 await s.act(u.MANAGER,'project.update',{id:projectId,requiredApprovals:['Bank approval','DISCOM approval']});
 const get=()=>s.one('SELECT * FROM projects WHERE id=?',projectId);
 let project=await get();
 const id=await s.act(u.MANAGER,'project.approval',{id:projectId,version:project.version,name:'Bank approval',status:'Approved',reference:'BANK-001'});
 project=await get();const version=project.version;
 await s.act(u.MANAGER,'project.approval',{id:projectId,version,name:'Bank approval',status:'Cash'});
 project=await get();assert.equal(project.data.finance,'Cash');assert.deepEqual(project.data.requiredApprovals,['DISCOM approval']);
 assert.equal((await s.one('SELECT * FROM leads WHERE id=?',leadId)).data.finance,'Cash');
 let approval=await s.one('SELECT * FROM records WHERE id=?',id);
 assert.equal(approval.status,'Cash');assert.equal(approval.data.reference,'BANK-001');assert.deepEqual(approval.data.history.map(entry=>entry.status),['Approved','Cash']);
 assert.equal((await s.all("SELECT * FROM records WHERE project_id=? AND kind='payment'",projectId)).length,0);
 await assert.rejects(s.act(u.MANAGER,'project.approval',{id:projectId,version,name:'Bank approval',status:'Processing'}),e=>e.status===409);
 await s.act(u.MANAGER,'project.approval',{id:projectId,version:project.version,name:'Bank approval',status:'Processing'});
 project=await get();assert.equal(project.data.finance,'Finance');assert.deepEqual(project.data.requiredApprovals,['DISCOM approval','Bank approval']);
 assert.equal((await s.one('SELECT * FROM leads WHERE id=?',leadId)).data.finance,'Finance');
 await assert.rejects(s.act(u.MANAGER,'project.approval',{id:projectId,version:project.version,name:'Bank approval',status:'Approved'}),/approval reference/);
 await assert.rejects(s.act(u.MANAGER,'project.approval',{id:projectId,version:project.version,name:'DISCOM approval',status:'Cash'}),/only available for bank approval/);
});

test('Cash needs no approval reference and respects permissions and read-only projects',async()=>{
 const {s,u}=await setup();const {leadId,projectId}=await createProject(s,u);
 let p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 const patch={id:projectId,version:p.version,name:'Bank approval',status:'Cash'};
 for(const role of ['SALES','CUSTOMER','PARTNER','TECHNICAL','VERIFIER','FINANCE'])await assert.rejects(s.act(u[role],'project.approval',patch),e=>e.status===403);
 await s.act(u.ADMIN,'project.approval',patch);
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 assert.equal(p.data.finance,'Cash');assert.deepEqual(p.data.requiredApprovals,[]);
 await s.act(u.ADMIN,'project.approval',{...patch,version:p.version,status:'Submitted'});
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 assert.equal(p.data.finance,'Finance');assert.deepEqual(p.data.requiredApprovals,['Bank approval']);
 await s.act(u.ADMIN,'project.update',{id:projectId,version:p.version,status:'Cancelled',note:'Customer cancelled'});
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await assert.rejects(s.act(u.ADMIN,'project.approval',{...patch,version:p.version}),/read-only/);
 assert.equal((await s.one('SELECT * FROM leads WHERE id=?',leadId)).data.finance,'Finance');
});

test('legacy quality phase is preserved but no longer blocks handover, tracking or completion',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);await completeProject(s,u,projectId);
 let p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 const legacyQuality={name:'Quality inspection',status:'Pending',evidence:'Old inspection record',history:[{status:'Processing',by:'previous-reviewer'}]};
 const phases=[...p.data.phases.slice(0,6),legacyQuality,{...p.data.phases[6],status:'Pending'}];
 await s.run('UPDATE projects SET status=?,data=? WHERE id=?','Installation',JSON.stringify({...p.data,phases,quality:'Failed',handover:false,handoverEvidence:''}),projectId);
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,phase:7,phaseStatus:'Processing'});
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await assert.rejects(s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,phase:7,phaseStatus:'Completed'}),/customer acknowledgement/);
 await s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,phase:7,phaseStatus:'Completed',evidence:'Customer signed handover'});
 for(const stepId of ['site_survey','quotation','order_confirmation','registration','installation']){
  p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
  await s.act(u.SALES,'project.tracking',{id:projectId,version:p.version,stepId,status:'Completed',quick:true});
 }
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 assert.deepEqual(p.data.phases[6],legacyQuality);assert.equal(p.data.phases[7].status,'Completed');
 await s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,status:'Completed'});
 assert.equal((await s.one('SELECT * FROM projects WHERE id=?',projectId)).status,'Completed');
});

test('new projects and legacy company settings use seven installation phases',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 const p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 assert.equal(p.data.phases.length,7);assert.equal(p.data.phases[6].name,'Customer handover');assert.ok(!p.data.phases.some(phase=>phase.name==='Quality inspection'));
 const legacySettings={...DEFAULT_SETTINGS,phases:[...PHASES.slice(0,6),'Quality inspection',PHASES[6]]};
 await s.run("UPDATE settings SET data=? WHERE key='company'",JSON.stringify(legacySettings));
 assert.deepEqual((await s.settings()).phases,PHASES);
 await s.act(u.ADMIN,'settings',legacySettings);assert.deepEqual((await s.settings()).phases,PHASES);
});

test('Subsidy tracks pending, processing and completed without changing saved installation phases',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 const get=()=>s.one('SELECT * FROM projects WHERE id=?',projectId);
 let p=await get();
 await assert.rejects(s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,subsidyStatus:'Processing'}),/previous installation phases/);
 for(let phase=0;phase<6;phase++)await s.act(u.TECHNICAL,'project.update',{id:projectId,phase,phaseStatus:'Completed'});
 p=await get();const originalPhases=structuredClone(p.data.phases);
 for(const subsidyStatus of ['Processing','Completed','Pending']){
  p=await get();await s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,subsidyStatus,subsidyNote:'SUB-001'});
  const saved=await get();assert.equal(saved.data.subsidy.status,subsidyStatus);assert.equal(saved.data.subsidy.note,'SUB-001');assert.equal(saved.data.subsidy.updatedBy,'MANAGER');assert.deepEqual(saved.data.phases,originalPhases);
 }
 p=await get();assert.deepEqual(p.data.subsidy.history.map(entry=>entry.status),['Processing','Completed','Pending']);
 await assert.rejects(s.act(u.MANAGER,'project.update',{id:projectId,version:p.version-1,subsidyStatus:'Completed'}),e=>e.status===409);
 await assert.rejects(s.act(u.CUSTOMER,'project.update',{id:projectId,version:p.version,subsidyStatus:'Completed'}),e=>e.status===403);
 await assert.rejects(s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,subsidyStatus:'Approved'}));
 const logs=await s.all("SELECT * FROM audit WHERE entity_id=? AND action='project.update'",projectId);
 assert.equal(logs.filter(log=>JSON.parse(log.detail).subsidyStatus).length,3);
});

test('Subsidy works on legacy projects with a hidden quality phase and an existing handover',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 let p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 const phases=p.data.phases.map(phase=>({...phase,status:'Completed',evidence:'Original saved evidence'}));
 phases.splice(6,0,{name:'Quality inspection',status:'Pending'});
 await s.run('UPDATE projects SET data=? WHERE id=?',JSON.stringify({...p.data,phases,handover:true,handoverEvidence:'Original customer signature'}),projectId);
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,subsidyStatus:'Processing'});
 const saved=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 assert.deepEqual(saved.data.phases,phases);assert.equal(saved.data.handoverEvidence,'Original customer signature');assert.equal(saved.data.subsidy.status,'Processing');
});

test('Documentation reviews required uploads together and preserves files and unrelated records',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 const update=async(status,documents)=>{const p=await s.one('SELECT * FROM projects WHERE id=?',projectId);return s.act(u.VERIFIER,'project.documentation',{id:projectId,version:p.version,status,documents});};
 await update('Processing',[]);
 await assert.rejects(update('Completed',[]),/Upload all required documents/);
 const ids=[];for(const documentType of DEFAULT_SETTINGS.requiredDocuments)ids.push(await s.upload(u.CUSTOMER,{projectId,documentType,name:'file.pdf',mime:'application/pdf',size:30,key:`private-${documentType}`}));
 const unrelated=await s.upload(u.MANAGER,{projectId,documentType:'Payment evidence',name:'payment.pdf',mime:'application/pdf',size:30,key:'payment-key'});
 const snapshots=await Promise.all(ids.map(id=>s.one('SELECT * FROM records WHERE id=?',id)));
 await update('Completed',snapshots.map(record=>({id:record.id,version:record.version})));
 for(const original of snapshots){const saved=await s.one('SELECT * FROM records WHERE id=?',original.id);assert.equal(saved.status,'Verified');assert.equal(saved.data.fileKey,original.data.fileKey);assert.equal(saved.data.review.by,u.VERIFIER.id);}
 assert.equal((await s.one('SELECT * FROM records WHERE id=?',unrelated)).status,'Submitted');
 let p=await s.one('SELECT * FROM projects WHERE id=?',projectId);assert.equal(p.data.documentation.status,'Completed');assert.deepEqual(p.data.documentation.history.map(entry=>entry.status),['Processing','Completed']);
 const latest=await Promise.all(ids.map(id=>s.one('SELECT * FROM records WHERE id=?',id)));
 await update('Pending',latest.map(record=>({id:record.id,version:record.version})));
 for(const id of ids)assert.equal((await s.one('SELECT * FROM records WHERE id=?',id)).status,'Pending');
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);assert.equal(p.data.documentation.status,'Pending');
});

test('Documentation rejects stale document reviews without partially updating other files',async()=>{
 const {s,u}=await setup();const {projectId}=await createProject(s,u);
 const ids=[];for(const documentType of DEFAULT_SETTINGS.requiredDocuments)ids.push(await s.upload(u.CUSTOMER,{projectId,documentType,name:'file.pdf',mime:'application/pdf',size:30,key:'private-file'}));
 const originals=await Promise.all(ids.map(id=>s.one('SELECT * FROM records WHERE id=?',id)));
 const p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 const patch={id:projectId,version:p.version,status:'Completed',documents:originals.map(record=>({id:record.id,version:record.version}))};
 for(const role of ['CUSTOMER','PARTNER','MANAGER','TECHNICAL','SALES','FINANCE'])await assert.rejects(s.act(u[role],'project.documentation',patch),e=>e.status===403);
 await s.act(u.VERIFIER,'record.update',{id:ids[0],version:originals[0].version,status:'Rejected',note:'Unreadable file'});
 await assert.rejects(s.act(u.VERIFIER,'project.documentation',patch),e=>e.status===409);
 assert.equal((await s.one('SELECT * FROM records WHERE id=?',ids[0])).status,'Rejected');assert.equal((await s.one('SELECT * FROM records WHERE id=?',ids[1])).status,'Submitted');
 assert.deepEqual(await s.one('SELECT * FROM projects WHERE id=?',projectId),p);
});

test('Documentation completion follows the latest uploaded file instead of an older verified copy',async()=>{
 const {requiredProjectDocuments,documentationStatus}=await import('../lib/documentation.mjs');
 const {s,u}=await setup();const {projectId}=await createProject(s,u);await completeProject(s,u,projectId);
 let p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await s.run('UPDATE projects SET status=? WHERE id=?','Installation',projectId);
 const name=DEFAULT_SETTINGS.requiredDocuments[0];
 const id=await s.upload(u.CUSTOMER,{projectId,documentType:name,name:'replacement.pdf',mime:'application/pdf',size:30,key:'replacement-key'});
 await s.run('UPDATE records SET created_at=? WHERE id=?','2099-01-01T00:00:00.000Z',id);
 const records=await s.all('SELECT * FROM records WHERE project_id=?',projectId);
 assert.equal(documentationStatus(requiredProjectDocuments(DEFAULT_SETTINGS.requiredDocuments,records),{status:'Completed'}),'Pending');
 p=await s.one('SELECT * FROM projects WHERE id=?',projectId);
 await assert.rejects(s.act(u.MANAGER,'project.update',{id:projectId,version:p.version,status:'Completed'}),/Verify the required document/);
});
