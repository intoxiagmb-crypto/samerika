import { projectProgress } from './project-progress.mjs';
import { requiredProjectDocuments } from './documentation.mjs';
import { updateApplicationTracking } from './application-tracking.mjs';
import { itemQuoteTotal } from './quotation.mjs';
import { quotationTaxLocation, quotationTerms } from './quotation-policy.mjs';
import { z } from 'zod';
import { ROLES, PHASES, LEAD_STATUSES, PROJECT_STAGES, DEFAULT_SETTINGS, BusinessError, assert, requireRole, canReadLead, quoteTotal, assertCompletion } from './policy.mjs';
const str=z.string().trim().min(1).max(2000);
const leadSchema=z.object({customerBillNumber:z.string().trim().max(100).default(''),applicationNumber:z.string().trim().max(100).default(''),name:str.max(120),mobile:z.string().transform(x=>x.replace(/[^0-9]/g,'')).refine(x=>x.length===10,'Enter a 10-digit mobile number.'),email:z.string().email().max(254).transform(x=>x.toLowerCase()),address:str,city:str.max(100),state:str.max(100),pin:z.string().regex(/^\d{6}$/,'Enter a 6-digit PIN code.'),capacity:z.coerce.number().positive().max(10000),monthlyBill:z.coerce.number().min(0).max(100000000).default(0),roofArea:z.coerce.number().min(0).max(10000000).default(0),system:z.enum(['On-grid','Hybrid','Off-grid']),property:z.enum(['Residential','Commercial','Industrial']),finance:z.enum(['Cash','Finance']),remarks:z.string().max(4000).default('')});
const uid=(prefix)=>`${prefix}-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll('-','').slice(0,12).toUpperCase()}`;
const now=()=>new Date().toISOString();
const parse=r=>r?{...r,...(r.data?{data:JSON.parse(r.data)}:{}),...(r.profile?{profile:JSON.parse(r.profile)}:{})}:r;
const kinds=['product','quote','survey','document','approval','incentive','payout','payment','ticket','rule'];
export class Business {
 constructor(db){this.db=db;}
 stmt(sql,...values){return this.db.prepare(sql).bind(...values);}
 async all(sql,...v){return (await this.stmt(sql,...v).all()).results.map(parse);}
 async one(sql,...v){return parse(await this.stmt(sql,...v).first());}
 async run(sql,...v){return this.stmt(sql,...v).run();}
 audit(user,id,action,detail){return this.stmt('INSERT INTO audit (id,actor_id,entity_id,action,detail,created_at) VALUES (?,?,?,?,?,?)',uid('LOG'),user.id,id,action,JSON.stringify(detail),now());}
 async settings(){const s=await this.one("SELECT * FROM settings WHERE key='company'");const settings={...DEFAULT_SETTINGS,...s?.data};if(settings.company==='Solaris')settings.company=DEFAULT_SETTINGS.company;settings.phases=settings.phases.filter(name=>name!=='Quality inspection');return settings;}
 async user(identity,registration){
  assert(identity,'Sign in to continue.',401);
  let u=await this.one('SELECT * FROM users WHERE id=?',identity.userId);
  if(!u){
   const role=registration==='PARTNER'?'PARTNER':'CUSTOMER';
   // Sites starts owner-private. The first authenticated owner initializes the workspace.
   await this.run("INSERT OR IGNORE INTO users (id,email,name,role,status,profile,created_at) SELECT ?,?,?,CASE WHEN NOT EXISTS(SELECT 1 FROM users) THEN 'ADMIN' ELSE ? END,CASE WHEN NOT EXISTS(SELECT 1 FROM users) THEN 'Active' ELSE ? END,'{}',?",identity.userId,identity.email.toLowerCase(),identity.displayName,role,role==='PARTNER'?'Pending':'Active',now());
   u=await this.one('SELECT * FROM users WHERE id=?',identity.userId);
  }
  assert(u,'An account with this email already exists. Contact the administrator.',409);
  assert(u.status!=='Suspended','Your account has been suspended. Contact the administrator.',403);
  return u;
 }
 async limit(key){const t=Date.now();await this.run('INSERT INTO request_limits(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<? THEN 1 ELSE count+1 END,expires_at=CASE WHEN expires_at<? THEN ? ELSE expires_at END',key,t+60000,t,t,t+60000);const l=await this.one('SELECT * FROM request_limits WHERE key=?',key);assert(l.count<=60,'Too many requests. Try again in a minute.',429);}
 async access(user,projectId){const p=await this.one('SELECT * FROM projects WHERE id=?',projectId);assert(p&&!p.data.deletedAt,'Project not found.',404);const l=await this.one('SELECT * FROM leads WHERE id=?',p.lead_id);assert(canReadLead(user,l,[p]),'This project is not assigned to you.',403);return {project:p,lead:l};}
 async snapshot(user){
  const ps=await this.all('SELECT * FROM projects ORDER BY created_at DESC');const ls=await this.all('SELECT * FROM leads ORDER BY created_at DESC');
  const deletedIds=new Set(ps.filter(p=>p.data.deletedAt).map(p=>p.id));
  const leads=ls.filter(l=>canReadLead(user,l,ps));const projects=ps.filter(p=>!deletedIds.has(p.id)&&leads.some(l=>l.id===p.lead_id));const ids=new Set(projects.map(p=>p.id));
  const rs=await this.all('SELECT * FROM records ORDER BY created_at DESC');
  const records=rs.filter(r=>{
   if(deletedIds.has(r.project_id))return false;
   if(user.role==='ADMIN')return true;
   if(r.kind==='product')return r.status==='Active';
   if(r.kind==='kyc')return r.owner_id===user.id;
   if(r.kind==='rule')return false;
   if(user.status!=='Active')return r.kind==='ticket'&&r.owner_id===user.id;
   if(r.kind==='ticket')return r.owner_id===user.id||['MANAGER'].includes(user.role)&&ids.has(r.project_id);
   if(['incentive','payout'].includes(r.kind))return user.role==='FINANCE'||user.role==='PARTNER'&&r.data.partnerId===user.id;
   if(r.kind==='payment')return ids.has(r.project_id)&&['CUSTOMER','FINANCE','MANAGER'].includes(user.role);
   if(r.kind==='document'&&user.role==='PARTNER')return ids.has(r.project_id);
   if(r.kind==='quote'&&['CUSTOMER','PARTNER'].includes(user.role))return ids.has(r.project_id)&&['Sent','Accepted','Rejected','Revision'].includes(r.status);
   return ids.has(r.project_id);
  }).map(r=>{
   if(user.role==='PARTNER'&&r.kind==='document')return {...r,data:{name:r.data.name,documentType:r.data.documentType,remarks:r.data.remarks}};
   return r;
  });
  const users=user.role==='ADMIN'?await this.all('SELECT * FROM users ORDER BY created_at DESC'):[];
  const logs=user.role==='ADMIN'?await this.all("SELECT a.*,CASE WHEN a.action='enquiry.received' THEN 'Website visitor' ELSE u.name END as actor_name FROM audit a JOIN users u ON a.actor_id=u.id ORDER BY a.created_at DESC LIMIT 300"):[];
  const notifications=await this.all('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',user.id);
  // Internal lead notes are not disclosed to customers or partners.
  const safeLeads=leads.map(l=>['CUSTOMER','PARTNER'].includes(user.role)?{...l,data:{...l.data,internalNotes:undefined,activities:undefined}}:l);
  const settings=await this.settings();
  return {user,deletedProjects:user.role==='ADMIN'?ps.filter(p=>deletedIds.has(p.id)):[],leads:safeLeads,projects:projects.map(p=>({...p,data:['CUSTOMER','PARTNER'].includes(user.role)?{...p.data,notes:undefined}:p.data,progress:projectProgress(p,rs,settings.requiredDocuments)})),records,users,audit:logs,notifications,settings};
 }
 async notifyProject(projectId,message,staffOnly=false){
  if(!projectId)return;
  const p=await this.one('SELECT * FROM projects WHERE id=?',projectId);if(!p)return;
  const l=await this.one('SELECT * FROM leads WHERE id=?',p.lead_id);
  const users=await this.all("SELECT * FROM users WHERE status='Active'");
  const recipients=users.filter(u=>u.role==='ADMIN'||[p.manager_id,p.technician_id,p.verifier_id,l.assigned_to].includes(u.id)||!staffOnly&&(u.id===l.partner_id||u.email===(l.data.customerAccessEmail??l.customer_email)));
  if(recipients.length)await this.db.batch(recipients.map(u=>this.stmt('INSERT INTO notifications(id,user_id,message,entity_id,created_at) VALUES(?,?,?,?,?)',uid('N'),u.id,message,projectId,now())));
 }
 async createRecord(user,kind,projectId,status,data,amount=0,reference=null){
  const id=uid(kind.toUpperCase());const t=now();await this.db.batch([
   this.stmt('INSERT INTO records (id,kind,project_id,owner_id,status,amount,reference,data,created_at,updated_at,version) VALUES (?,?,?,?,?,?,?,?,?,?,1)',id,kind,projectId,user.id,status,amount,reference,JSON.stringify(data),t,t),
   this.audit(user,id,`${kind}.created`,{projectId,status})]);await this.notifyProject(projectId,`${kind.charAt(0).toUpperCase()+kind.slice(1)} added to ${projectId}`,['quote','incentive','payout','payment'].includes(kind));return id;
 }
 async updateRecord(user,r,status,data=r.data,amount=r.amount){
  const statements=[this.stmt('UPDATE records SET status=?,data=?,amount=?,updated_at=?,version=version+1 WHERE id=? AND version=?',status,JSON.stringify(data),amount,now(),r.id,r.version)];if(r.kind==='payout'&&status==='Paid')statements.push(this.stmt('INSERT INTO payment_references(reference,record_id,created_at) VALUES(?,?,?)',data.paymentReference,r.id,now()));statements.push(this.audit(user,r.id,`${r.kind}.updated`,{from:r.status,to:status}));const results=await this.db.batch(statements);const result=results[0];
  assert(result.meta.changes===1,'Record changed. Refresh and try again.',409);
  if(r.kind==='quote'&&status==='Accepted')await this.run("UPDATE projects SET data=json_set(data,'$.amount',?),version=version+1,updated_at=? WHERE id=?",r.amount,now(),r.project_id);
  await this.notifyProject(r.project_id,`${r.kind.charAt(0).toUpperCase()+r.kind.slice(1)} ${status.toLowerCase()} · ${r.project_id}`,['incentive','payout','payment'].includes(r.kind)||r.kind==='quote'&&!['Sent','Accepted','Rejected','Revision'].includes(status));
  return r.id;
 }
 async act(user,action,input){
  assert(typeof action==='string','Choose an action.');await this.limit(user.id);
  const d=input||{};
  if(action==='project.delete'||action==='project.restore'){
   requireRole(user,['ADMIN']);
   const p=await this.one('SELECT * FROM projects WHERE id=?',str.parse(d.id));assert(p,'Project not found.',404);
   assert(Number.isInteger(d.version)&&d.version===p.version,'Project changed. Refresh and try again.',409);
   const deleting=action==='project.delete';
   assert(deleting?!p.data.deletedAt:!!p.data.deletedAt,deleting?'Project is already deleted.':'Project is not deleted.',409);
   const at=now(),changeId=crypto.randomUUID(),data={...p.data,deletionChangeId:changeId};
   if(deleting){data.deletedAt=at;data.deletedBy=user.id;}else{delete data.deletedAt;delete data.deletedBy;}
   const results=await this.db.batch([
    this.stmt('UPDATE projects SET data=?,updated_at=?,version=version+1 WHERE id=? AND version=?',JSON.stringify(data),at,p.id,p.version),
    this.stmt("INSERT INTO audit(id,actor_id,entity_id,action,detail,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM projects WHERE id=? AND version=? AND json_extract(data,'$.deletionChangeId')=?)",uid('LOG'),user.id,p.id,action,JSON.stringify({name:p.data.name,status:p.status}),at,p.id,p.version+1,changeId)
   ]);
   assert(results[0].meta.changes===1,'Project changed. Refresh and try again.',409);
   return p.id;
  }
  if(action==='profile'){
   const name=str.max(120).parse(d.name);const role=user.role==='CUSTOMER'&&d.role==='PARTNER'?'PARTNER':user.role;const status=role==='PARTNER'&&user.role==='CUSTOMER'?'Pending':user.status;
   const profile=z.object({company:z.string().max(150).default(''),mobile:z.string().max(20).default(''),city:z.string().max(100).default(''),address:z.string().max(2000).default('')}).parse(d);
   await this.run('UPDATE users SET name=?,role=?,status=?,profile=? WHERE id=?',name,role,status,JSON.stringify(profile),user.id);return user.id;
  }
  if(action==='user.update'){
   requireRole(user,['ADMIN']);const target=await this.one('SELECT * FROM users WHERE id=?',d.id);assert(target,'User not found.',404);
   const role=z.enum(ROLES).parse(d.role);const status=z.enum(['Active','Pending','Suspended']).parse(d.status);
   assert(target.id!==user.id||role==='ADMIN'&&status==='Active','You cannot remove your own administrator access.');
   if(role==='PARTNER'&&status==='Active'&&target.status!=='Active')assert(await this.one("SELECT id FROM records WHERE kind='kyc' AND owner_id=? AND status='Verified'",target.id),'Verify the partner KYC document before activating the account.');
   await this.db.batch([this.stmt('UPDATE users SET role=?,status=? WHERE id=?',role,status,target.id),this.audit(user,target.id,action,{role,status})]);return target.id;
  }
  if(action==='settings'){
   requireRole(user,['ADMIN']);const values=z.object({company:str.max(120),tagline:z.string().max(200),contactEmail:z.union([z.string().email(),z.literal('')]),contactPhone:z.string().max(30),serviceLocations:z.string().max(1000),taxRate:z.coerce.number().min(0).max(100),incentivePerKw:z.coerce.number().min(0).max(1000000),requiredDocuments:z.array(str.max(100)).min(1).max(20),phases:z.array(str.max(100)).min(7).max(8).transform(phases=>phases.filter(name=>name!=='Quality inspection')).refine(phases=>phases.length===PHASES.length,'Choose the seven installation phases.'),address:z.string().max(1000).default(''),gstin:z.string().max(30).default(''),state:z.string().max(100).default(''),bankDetails:z.string().max(2000).default(''),quotationTerms:z.string().max(4000).default('')}).parse(d);
   await this.db.batch([this.stmt("INSERT INTO settings(key,data) VALUES('company',?) ON CONFLICT(key) DO UPDATE SET data=excluded.data",JSON.stringify(values)),this.audit(user,'company',action,{values})]);return 'company';
  }
  if(action==='lead.create'){
   requireRole(user,['ADMIN','PARTNER','SALES','CUSTOMER','MANAGER']);const data=leadSchema.parse(d);
   if(user.role==='CUSTOMER')assert(data.email===user.email,'Use your signed-in email for your enquiry.');
   const duplicate=await this.one('SELECT id FROM leads WHERE mobile=? OR customer_email=?',data.mobile,data.email);
   assert(!duplicate,'An enquiry already exists for this mobile or email. Contact your administrator for an ownership review.',409);
   const id=uid('LEAD');const t=now();const source=user.role==='PARTNER'?'Channel Partner':user.role==='CUSTOMER'?'Website':'Manual Entry';
   const intakeStaff=await this.all("SELECT * FROM users WHERE role IN ('SALES','MANAGER') AND status='Active' ORDER BY created_at");
   if(['PARTNER','CUSTOMER'].includes(user.role))assert(intakeStaff.length,'Enquiries are temporarily unavailable. Please try again later.',503);
   const statements=[this.stmt('INSERT INTO leads(id,owner_id,partner_id,customer_email,name,mobile,assigned_to,status,data,created_at,updated_at,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,1)',id,user.id,user.role==='PARTNER'?user.id:null,data.email,data.name,data.mobile,user.role==='SALES'?user.id:null,'New',JSON.stringify({...data,source,activities:[]}),t,t),this.audit(user,id,action,{source})];
   for(const employee of intakeStaff.filter(employee=>canReadLead(employee,{owner_id:user.id,assigned_to:user.role==='SALES'?user.id:null,data:{source}},[])))statements.push(this.stmt('INSERT INTO notifications(id,user_id,message,entity_id,created_at) VALUES(?,?,?,?,?)',uid('N'),employee.id,`New enquiry from ${data.name}`,id,t));
   await this.db.batch(statements);return id;
  }
  if(action==='lead.profile'){
   requireRole(user,['ADMIN','SALES','MANAGER']);
   const lead=await this.one('SELECT * FROM leads WHERE id=?',d.id);assert(lead,'Lead not found.',404);
   const projects=await this.all('SELECT * FROM projects WHERE lead_id=?',lead.id);
   assert(canReadLead(user,lead,projects),'This lead is not assigned to you.',403);
   assert(Number.isInteger(d.version)&&d.version===lead.version,'Lead changed. Refresh and try again.',409);
   const profileSchema=leadSchema.pick({name:true,mobile:true,city:true,property:true,monthlyBill:true,roofArea:true,remarks:true,customerBillNumber:true,applicationNumber:true}).extend({
    email:z.string().trim().max(254).transform(value=>value.toLowerCase()).pipe(z.union([z.string().email(),z.literal('')])),
    address:z.string().trim().max(2000),state:z.string().trim().max(100),
    pin:z.union([z.string().trim().regex(/^\d{6}$/,'Enter a 6-digit PIN code.'),z.literal('')]),
   }).partial();
   const patch=profileSchema.parse(d);assert(Object.keys(patch).length,'Edit at least one profile field.');
   const profile={...lead.data,name:lead.name,mobile:lead.mobile,email:lead.customer_email,...patch};
   if(!lead.data.qualificationRequired)leadSchema.pick({address:true,city:true,state:true,pin:true}).parse(profile);
   const duplicate=await this.one("SELECT id FROM leads WHERE id<>? AND (mobile=? OR (?<>'' AND customer_email=?))",lead.id,profile.mobile,profile.email,profile.email);
   assert(!duplicate,'Another lead already uses this mobile or email.',409);
   const changed=Object.keys(patch).filter(key=>profile[key]!==({ ...lead.data,name:lead.name,mobile:lead.mobile,email:lead.customer_email })[key]);
   if(!changed.length)return lead.id;
   const at=now(),changeId=uid('PROFILE');
   // Contact corrections must not transfer an existing customer's portal access.
   const data={...profile,customerAccessEmail:lead.data.customerAccessEmail??lead.customer_email,profileChangeId:changeId,activities:[...(lead.data.activities||[]),{by:user.name,status:lead.status,note:`Customer profile updated: ${changed.join(', ')}.`,at}]};
   const marker="EXISTS(SELECT 1 FROM leads WHERE id=? AND version=? AND json_extract(data,'$.profileChangeId')=?)";
   const results=await this.db.batch([
    this.stmt('UPDATE leads SET name=?,mobile=?,customer_email=?,data=?,updated_at=?,version=version+1 WHERE id=? AND version=?',profile.name,profile.mobile,profile.email,JSON.stringify(data),at,lead.id,lead.version),
    this.stmt(`UPDATE projects SET data=json_set(data,'$.name',?,'$.address',?,'$.city',?,'$.state',?,'$.pin',?,'$.customerBillNumber',?${patch.applicationNumber!==undefined?",'$.tracking.applicationNumber',?":''}),updated_at=?,version=version+1 WHERE lead_id=? AND ${marker}`,profile.name,profile.address,profile.city,profile.state,profile.pin,profile.customerBillNumber||'',...(patch.applicationNumber!==undefined?[patch.applicationNumber]:[]),at,lead.id,lead.id,lead.version+1,changeId),
    this.stmt(`INSERT INTO audit(id,actor_id,entity_id,action,detail,created_at) SELECT ?,?,?,?,?,? WHERE ${marker}`,uid('LOG'),user.id,lead.id,action,JSON.stringify({fields:changed}),at,lead.id,lead.version+1,changeId),
   ]);
   assert(results[0].meta.changes===1,'Lead changed. Refresh and try again.',409);return lead.id;
  }
  if(action==='lead.update'){
   requireRole(user,['ADMIN','SALES','MANAGER']);const l=await this.one('SELECT * FROM leads WHERE id=?',d.id);assert(l,'Lead not found.',404);
   const projects=await this.all('SELECT * FROM projects WHERE lead_id=?',l.id);assert(canReadLead(user,l,projects),'This lead is not assigned to you.',403);
   const status=z.enum(LEAD_STATUSES).parse(d.status||l.status);assert(status!=='Converted','Use Convert to project.');assert(l.status!=='Converted','Manage converted leads through their project.');
   let assigned=l.assigned_to;if(d.assignedTo!==undefined){requireRole(user,['ADMIN']);const a=await this.one("SELECT id FROM users WHERE id=? AND role='SALES' AND status='Active'",d.assignedTo);assert(a,'Select an active sales employee.');assigned=a.id;}
   const note=z.string().max(4000).parse(d.note||'');if(['Lost','Rejected','Cancelled','Duplicate'].includes(status))assert(note.trim(),'Add a reason for this status.');
   const qualification=d.qualification?leadSchema.pick({address:true,city:true,state:true,pin:true,capacity:true,system:true,finance:true}).parse(d.qualification):{};
   const data={...l.data,...qualification,...(d.qualification?{qualificationRequired:false}:{}),followUp:d.followUp||l.data.followUp,activities:[...(l.data.activities||[]),{by:user.name,status,note,at:now()}]};
   const res=await this.run('UPDATE leads SET status=?,assigned_to=?,data=?,updated_at=?,version=version+1 WHERE id=? AND version=?',status,assigned,JSON.stringify(data),now(),l.id,d.version||l.version);assert(res.meta.changes===1,'Lead changed. Refresh and try again.',409);await this.audit(user,l.id,action,{from:l.status,to:status,note}).run();return l.id;
  }
  if(action==='project.create'){
   requireRole(user,['ADMIN','SALES','MANAGER']);const l=await this.one('SELECT * FROM leads WHERE id=?',d.leadId);assert(l,'Lead not found.',404);assert(canReadLead(user,l,[]),'This lead is not assigned to you.',403);
   assert(!l.data.qualificationRequired,'Confirm site details on the lead before converting it to a project.');
   assert(!['Lost','Rejected','Cancelled','Duplicate'].includes(l.status),'Requalify this lead before conversion.');
   const id=uid('SOL');const t=now();const data={name:l.name,customerBillNumber:l.data.customerBillNumber||'',tracking:{applicationNumber:l.data.applicationNumber||''},capacity:l.data.capacity,system:l.data.system,finance:l.data.finance,address:l.data.address,city:l.data.city,amount:0,requiredApprovals:l.data.finance==='Finance'?['Bank approval']:[],phases:PHASES.map(name=>({name,status:'Pending'})),quality:'Pending',handover:false,dueDate:d.dueDate||'',notes:[]};
   try{await this.db.batch([this.stmt('INSERT INTO projects(id,lead_id,manager_id,technician_id,verifier_id,status,data,created_at,updated_at,version) VALUES(?,?,?,NULL,NULL,?,?,?,?,1)',id,l.id,user.role==='MANAGER'?user.id:null,'Survey',JSON.stringify(data),t,t),this.stmt("UPDATE leads SET status='Converted',updated_at=?,version=version+1 WHERE id=?",t,l.id),this.audit(user,id,action,{lead:l.id,partner:l.partner_id})]);}catch(e){if(String(e).includes('UNIQUE'))throw new BusinessError('This lead already has a project.',409);throw e;}return id;
  }
  if(action==='product.create'||action==='product.update'){
   requireRole(user,['ADMIN']);const p=z.object({name:str.max(150),brand:str.max(100),category:z.enum(['Solar kit','Solar panel','Inverter','Battery','Accessories','Services']),capacity:z.coerce.number().positive().max(10000),price:z.coerce.number().positive().max(100000000),system:z.enum(['On-grid','Hybrid','Off-grid']),warranty:str.max(300),description:z.string().max(4000).default(''),unit:z.string().trim().min(1).max(30).default('Pcs'),hsn:z.string().trim().max(20).default(''),taxRate:z.preprocess(v=>v===''?undefined:v,z.coerce.number().min(0).max(100).optional())}).parse(d);
   if(action==='product.update'){
    const current=await this.one("SELECT * FROM records WHERE id=? AND kind='product'",d.id);assert(current,'Product not found.',404);
    assert(d.version===current.version,'Product changed. Refresh and try again.',409);
    return this.updateRecord(user,current,current.status,p,Math.round(p.price*100));
   }
   return this.createRecord(user,'product',null,'Active',p,Math.round(p.price*100));
  }
  if(action==='ticket.create'){
   const data=z.object({title:str.max(200),category:str.max(100),priority:z.enum(['Normal','High','Urgent']),description:str.max(5000)}).parse(d);
   if(d.projectId)await this.access(user,d.projectId);return this.createRecord(user,'ticket',d.projectId||null,'Open',{...data,messages:[]});
  }
  if(action==='notification.read'){await this.run('UPDATE notifications SET read=1 WHERE user_id=?',user.id);return user.id;}
  if(action==='record.update'){
   const r=await this.one('SELECT * FROM records WHERE id=?',d.id);assert(r,'Record not found.',404);
   if(r.project_id)await this.access(user,r.project_id);
   assert(!d.version||d.version===r.version,'Record changed. Refresh and try again.',409);
   let next={...r.data};const status=str.parse(d.status);const note=z.string().max(4000).parse(d.note||'');
   if(['Rejected','Correction Required','Failed','Revision'].includes(status))assert(note.trim(),'A reason is required.');
   if(r.kind==='quote'){
    if(['Accepted','Rejected','Revision'].includes(status)){requireRole(user,['CUSTOMER','ADMIN']);assert(r.status==='Sent'||r.status==='Revision','Only a sent quotation can be accepted or rejected.');if(user.role==='ADMIN')assert(note.trim(),'Record the customer acceptance or rejection evidence.');if(status==='Accepted'){assert(r.data.validUntil>=now().slice(0,10),'This quotation has expired. Request a new quotation.');assert(!await this.one("SELECT id FROM records WHERE kind='quote' AND project_id=? AND status='Accepted' AND id<>?",r.project_id,r.id),'A quotation is already accepted for this project.');}next.acceptance={by:user.id,at:now(),note};}
    else {requireRole(user,['ADMIN']);assert(['Approved','Sent'].includes(status),'Invalid quote transition.');assert(status==='Approved'&&r.status==='Draft'||status==='Sent'&&r.status==='Approved','Approve the quotation before sending.');}
   }else if(r.kind==='kyc'){requireRole(user,['ADMIN']);assert(['Verified','Rejected','Correction Required'].includes(status),'Invalid KYC review status.');assert(r.data.fileKey,'A KYC document is required.');next.review={by:user.id,at:now(),note};}
   else if(r.kind==='survey'){requireRole(user,['ADMIN','TECHNICAL','MANAGER']);assert(['Scheduled','Submitted','Approved','Rejected','Resurvey Required'].includes(status),'Invalid survey status.');if(status==='Approved'){requireRole(user,['ADMIN','MANAGER']);assert(r.data.feasibility==='Feasible','Survey must confirm technical feasibility.');}}
   else if(r.kind==='document'){requireRole(user,['ADMIN','VERIFIER']);assert(['Pending','Under Review','Verified','Rejected','Correction Required'].includes(status),'Invalid document status.');assert(r.data.fileKey,'Upload the document before verification.');next.review={by:user.id,at:now(),note};}
   else if(r.kind==='approval'){requireRole(user,['ADMIN','MANAGER']);assert(['Submitted','Processing','Approved','Rejected'].includes(status),'Invalid approval status.');if(status==='Approved')assert(r.data.reference&&note.trim(),'Record the approval reference and verification remarks.');}
   else if(r.kind==='incentive'){requireRole(user,['ADMIN']);assert(r.status==='Expected'&&['Approved','Rejected'].includes(status),'This incentive has already been reviewed.');next.approval={by:user.id,at:now(),note};}
   else if(r.kind==='payout'){requireRole(user,['ADMIN','FINANCE']);assert(r.status!=='Paid','A paid ledger entry cannot be overwritten.');assert(['Processing','Paid','Failed'].includes(status),'Invalid payout status.');if(status==='Paid'){assert(d.reference&&d.evidenceId,'Payment reference and uploaded evidence are required.');const ev=await this.one("SELECT * FROM records WHERE id=? AND kind='document'",d.evidenceId);assert(ev&&ev.project_id===r.project_id&&ev.data.fileKey,'Upload valid evidence for this project.');next.paymentReference=str.parse(d.reference);next.evidenceId=d.evidenceId;next.paidAt=now();next.verifiedBy=user.id;}}
   else if(r.kind==='ticket'){assert(user.role==='ADMIN'||r.owner_id===user.id||user.role==='MANAGER','Ticket access denied.',403);assert(['Open','In Progress','Resolved'].includes(status),'Invalid ticket status.');next.messages=[...(next.messages||[]),{name:user.name,note,at:now()}];}
   else if(r.kind==='product'){requireRole(user,['ADMIN']);assert(['Active','Archived'].includes(status),'Invalid product status.');}
   else throw new BusinessError('This record cannot be edited.');
   next.remarks=note;return this.updateRecord(user,r,status,next);
  }
  if(action==='quote.create'){
   requireRole(user,['ADMIN','SALES','MANAGER']);
   let p, l;
   if(d.projectId){({project:p,lead:l}=await this.access(user,d.projectId));if(d.customerId)assert(d.customerId===l.id,'Customer does not match the project.');}
   else {
    l=await this.one('SELECT * FROM leads WHERE id=?',str.parse(d.customerId));assert(l,'Select a customer.',404);
    p=await this.one('SELECT * FROM projects WHERE lead_id=?',l.id);
    assert(canReadLead(user,l,p?[p]:[]),'This customer is not assigned to you.',403);
   }
   assert(!p?.data.deletedAt,'Restore this project before creating a quotation.',409);
   assert(!l.data.qualificationRequired,'Confirm site details in Leads & customers before creating a quotation for this enquiry.');
   assert(!['Lost','Rejected','Cancelled','Duplicate'].includes(l.status),'Requalify this customer before creating a quotation.');
   assert(!p||!['Completed','Cancelled'].includes(p.status),'Completed or cancelled projects are read-only.');
   const settings=await this.settings();
   const validUntil=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>{const date=new Date(v);return !Number.isNaN(date.getTime())&&date.toISOString().slice(0,10)===v;},'Enter a valid date.').parse(d.validUntil);
   assert(validUntil>=now().slice(0,10),'Quotation validity must be today or later.');
   const terms=quotationTerms(settings);
   const taxLocation=quotationTaxLocation(settings,l.data);
   const {taxMode}=taxLocation;
   const priceTaxMode=z.enum(['exclusive','inclusive']).default('exclusive').parse(d.priceTaxMode);
   let details;
   if(d.items!==undefined){
    const selected=z.array(z.object({productId:str,quantity:z.coerce.number().positive().max(10000)})).min(1).max(100).parse(d.items);
    assert(new Set(selected.map(x=>x.productId)).size===selected.length,'Use quantity to combine duplicate items.');
    const items=[];
    for(const item of selected){
     const product=await this.one("SELECT * FROM records WHERE id=? AND kind='product' AND status='Active'",item.productId);
     assert(product,'A selected item is unavailable. Refresh the catalogue.');
     items.push({productId:product.id,name:product.data.name,description:product.data.description||'',brand:product.data.brand,warranty:product.data.warranty,hsn:product.data.hsn||'',unit:product.data.unit||'Pcs',quantity:item.quantity,unitPrice:product.amount,taxRate:product.data.taxRate??settings.taxRate});
    }
    details={...itemQuoteTotal(items,{priceTaxMode,installation:Number(d.installation||0),discount:Number(d.discount||0),taxRate:settings.taxRate}),capacity:l.data.capacity,installation:Number(d.installation||0),discount:Number(d.discount||0)};
   }else {
    // Preserve older callers and the historical capacity-based solar-kit calculation.
    const product=await this.one("SELECT * FROM records WHERE id=? AND kind='product' AND status='Active'",d.productId);
    assert(product&&product.data.category==='Solar kit','Select an available solar kit.');
    const pricing={unitPrice:product.amount/100/product.data.capacity,capacity:l.data.capacity,installation:Number(d.installation||0),discount:Number(d.discount||0),taxRate:settings.taxRate};
    details=priceTaxMode==='inclusive'
     ? {...pricing,...itemQuoteTotal([{productId:product.id,name:product.data.name,description:product.data.description||'',warranty:product.data.warranty,hsn:product.data.hsn||'',unit:'kW',quantity:pricing.capacity,unitPrice:Math.round(pricing.unitPrice*100),taxRate:pricing.taxRate}],{...pricing,priceTaxMode}),product:{...product.data}}
     : {...pricing,...quoteTotal(pricing),priceTaxMode,product:{...product.data}};
   }
   const data={...details,customer:l.name,customerDetails:{name:l.name,mobile:l.mobile,email:l.customer_email,address:l.data.address,city:l.data.city,state:l.data.state,pin:l.data.pin},company:{name:settings.company,tagline:settings.tagline,address:settings.address||'',gstin:settings.gstin||'',state:settings.state||'',email:settings.contactEmail,phone:settings.contactPhone,bankDetails:settings.bankDetails||''},...taxLocation,taxMode,validUntil,terms,version:3};
   if(p)return this.createRecord(user,'quote',p.id,'Draft',data,details.total);
   // First quotation creates the customer's project and quotation atomically.
   const projectId=uid('SOL'),id=uid('QUOTE'),t=now();
   const projectData={name:l.name,customerBillNumber:l.data.customerBillNumber||'',tracking:{applicationNumber:l.data.applicationNumber||''},capacity:l.data.capacity,system:l.data.system,finance:l.data.finance,address:l.data.address,city:l.data.city,amount:0,requiredApprovals:l.data.finance==='Finance'?['Bank approval']:[],phases:PHASES.map(name=>({name,status:'Pending'})),quality:'Pending',handover:false,dueDate:'',notes:[]};
   try {await this.db.batch([
    this.stmt('INSERT INTO projects(id,lead_id,manager_id,technician_id,verifier_id,status,data,created_at,updated_at,version) VALUES(?,?,?,NULL,NULL,?,?,?,?,1)',projectId,l.id,user.role==='MANAGER'?user.id:null,'Quotation',JSON.stringify(projectData),t,t),
    this.stmt("UPDATE leads SET status='Converted',updated_at=?,version=version+1 WHERE id=?",t,l.id),
    this.stmt('INSERT INTO records(id,kind,project_id,owner_id,status,amount,data,created_at,updated_at,version) VALUES(?,?,?,?,?,?,?,?,?,1)',id,'quote',projectId,user.id,'Draft',details.total,JSON.stringify(data),t,t),
    this.audit(user,projectId,'project.create',{lead:l.id,source:'quotation'}),this.audit(user,id,'quote.created',{projectId,status:'Draft'})
   ]);}catch(e){if(String(e).includes('UNIQUE'))throw new BusinessError('This customer changed. Refresh and try again.',409);throw e;}
   await this.notifyProject(projectId,`Quotation added to ${projectId}`,true);return id;
  }
  if(action==='survey.create'){
   requireRole(user,['ADMIN','TECHNICAL','MANAGER']);await this.access(user,d.projectId);const data=z.object({date:str,roofType:str,area:z.coerce.number().positive(),shading:str,feasibility:z.enum(['Feasible','Not feasible','Resurvey required']),notes:z.string().max(4000).default('')}).parse(d);return this.createRecord(user,'survey',d.projectId,'Submitted',{...data,surveyor:user.name});
  }
  if(action==='approval.create'){
   requireRole(user,['ADMIN','MANAGER']);const {project:p}=await this.access(user,d.projectId);const data=z.object({name:str.max(100),reference:str.max(150),followUp:z.string().max(30).default(''),notes:z.string().max(4000).default('')}).parse(d);assert(!(p.data.finance==='Cash'&&data.name==='Bank approval'),'Cash projects do not require a bank approval.');return this.createRecord(user,'approval',p.id,'Submitted',data);
  }
  if(action==='payment.create'){
   requireRole(user,['ADMIN','FINANCE']);await this.access(user,d.projectId);const amount=z.coerce.number().positive().max(1e9).parse(d.amount);const reference=str.parse(d.reference);const evidence=await this.one("SELECT * FROM records WHERE id=? AND kind='document' AND project_id=?",d.evidenceId,d.projectId);assert(evidence?.data?.fileKey,'Upload payment evidence for this project first.');return this.createRecord(user,'payment',d.projectId,'Recorded',{evidenceId:evidence.id,reference,method:d.method||'Bank transfer',date:now()},Math.round(amount*100),reference);
  }
  if(action==='project.documentation'){
   requireRole(user,['ADMIN','VERIFIER']);const {project:p}=await this.access(user,d.id);
   assert(!['Completed','Cancelled'].includes(p.status),'Completed or cancelled projects are read-only.');
   assert(Number.isInteger(d.version)&&d.version===p.version,'Project changed. Refresh and try again.',409);
   const status=z.enum(['Pending','Processing','Completed']).parse(d.status);
   const allDocuments=await this.all("SELECT * FROM records WHERE project_id=? AND kind='document'",p.id);
   const settings=await this.settings();const required=requiredProjectDocuments(settings.requiredDocuments,allDocuments);
   const selected=required.filter(Boolean);
   const expected=z.array(z.object({id:str,version:z.number().int()})).max(20).parse(d.documents);
   assert(expected.length===selected.length&&selected.every(document=>expected.some(item=>item.id===document.id&&item.version===document.version)),'Documents changed. Refresh and try again.',409);
   if(status==='Completed')assert(required.every(document=>document?.data.fileKey),'Upload all required documents before completing Documentation.');
   const at=now(),changeId=uid('DOCS');const entry={status,by:user.id,updatedBy:user.name,at};
   const documentation={...entry,changeId,history:[...(p.data.documentation?.history||[]),entry]};
   const recordStatus={Pending:'Pending',Processing:'Under Review',Completed:'Verified'}[status];
   const marker="EXISTS(SELECT 1 FROM projects WHERE id=? AND version=? AND json_extract(data,'$.documentation.changeId')=?)";
   const guards=selected.map(()=>"EXISTS(SELECT 1 FROM records WHERE id=? AND version=?)");
   const results=await this.db.batch([
    this.stmt(`UPDATE projects SET data=?,updated_at=?,version=version+1 WHERE id=? AND version=? AND (SELECT count(*) FROM records WHERE project_id=? AND kind='document')=?${guards.length?' AND '+guards.join(' AND '):''}`,JSON.stringify({...p.data,documentation}),at,p.id,p.version,p.id,allDocuments.length,...selected.flatMap(document=>[document.id,document.version])),
    ...selected.map(document=>this.stmt(`UPDATE records SET status=?,data=?,updated_at=?,version=version+1 WHERE id=? AND ${marker}`,recordStatus,JSON.stringify({...document.data,review:{by:user.id,at,note:`Documentation marked ${status}.`},reviewHistory:[...(document.data.reviewHistory||(document.data.review?[{status:document.status,...document.data.review}]:[])),{status:recordStatus,by:user.id,at}]}),at,document.id,p.id,p.version+1,changeId)),
    this.stmt(`INSERT INTO audit(id,actor_id,entity_id,action,detail,created_at) SELECT ?,?,?,?,?,? WHERE ${marker}`,uid('LOG'),user.id,p.id,action,JSON.stringify({...entry,documents:selected.map(document=>document.id)}),at,p.id,p.version+1,changeId)
   ]);assert(results[0].meta.changes===1,'Project or documents changed. Refresh and try again.',409);return p.id;
  }
  if(action==='project.approval'){
   requireRole(user,['ADMIN','MANAGER']);const {project:p}=await this.access(user,d.id);
   assert(!['Completed','Cancelled'].includes(p.status),'Completed or cancelled projects are read-only.');
   assert(Number.isInteger(d.version)&&d.version===p.version,'Project changed. Refresh and try again.',409);
   const name=str.max(100).parse(d.name);const bank=name==='Bank approval';
   assert(p.data.requiredApprovals.includes(name)||bank&&p.data.finance==='Cash','Choose a required project approval.');
   const status=z.enum(['Submitted','Processing','Approved','Cash']).parse(d.status);
   assert(status!=='Cash'||bank,'Cash is only available for bank approval.');
   const reference=z.string().trim().max(150).parse(d.reference||'');
   if(status==='Approved')assert(reference,'Add the approval reference in this row.');
   const previous=await this.one("SELECT * FROM records WHERE project_id=? AND kind='approval' AND json_extract(data,'$.name')=? ORDER BY created_at DESC LIMIT 1",p.id,name);
   const entry={status,reference,by:user.id,updatedBy:user.name,at:now()};
   const savedReference=status==='Cash'?(previous?.data.reference||''):reference;
   const recordData={...previous?.data,name,reference:savedReference,history:[...(previous?.data.history||(previous?[{status:previous.status,reference:previous.data.reference,note:previous.data.remarks,at:previous.updated_at}]:[])),entry]};
   const recordId=previous?.id||uid('APPROVAL');const changeId=uid('CHANGE');const at=now();
   const marker="EXISTS(SELECT 1 FROM projects WHERE id=? AND version=? AND json_extract(data,'$.approvalChangeId')=?)";
   const approvalGuard=previous?'EXISTS(SELECT 1 FROM records WHERE id=? AND version=?)':"NOT EXISTS(SELECT 1 FROM records WHERE project_id=? AND kind='approval' AND json_extract(data,'$.name')=?)";
   const guardValues=previous?[previous.id,previous.version]:[p.id,name];
   const finance=bank?(status==='Cash'?'Cash':'Finance'):p.data.finance;
   const requiredApprovals=bank?(status==='Cash'?p.data.requiredApprovals.filter(value=>value!==name):[...new Set([...p.data.requiredApprovals,name])]):p.data.requiredApprovals;
   const results=await this.db.batch([
    this.stmt(`UPDATE projects SET data=?,updated_at=?,version=version+1 WHERE id=? AND version=? AND ${approvalGuard}`,JSON.stringify({...p.data,finance,requiredApprovals,approvalChangeId:changeId}),at,p.id,p.version,...guardValues),
    ...(bank?[this.stmt(`UPDATE leads SET data=json_set(data,'$.finance',?),updated_at=?,version=version+1 WHERE id=? AND ${marker}`,finance,at,p.lead_id,p.id,p.version+1,changeId)]:[]),
    previous?this.stmt(`UPDATE records SET status=?,data=?,updated_at=?,version=version+1 WHERE id=? AND ${marker}`,status,JSON.stringify(recordData),at,recordId,p.id,p.version+1,changeId):this.stmt(`INSERT INTO records(id,kind,project_id,owner_id,status,amount,reference,data,created_at,updated_at,version) SELECT ?,'approval',?,?,?,0,?,?,?,?,1 WHERE ${marker}`,recordId,p.id,user.id,status,savedReference,JSON.stringify(recordData),at,at,p.id,p.version+1,changeId),
    this.stmt(`INSERT INTO audit(id,actor_id,entity_id,action,detail,created_at) SELECT ?,?,?,?,?,? WHERE ${marker}`,uid('LOG'),user.id,recordId,action,JSON.stringify(entry),at,p.id,p.version+1,changeId)
   ]);assert(results[0].meta.changes===1,'Project changed. Refresh and try again.',409);return recordId;
  }
  if(action==='project.tracking'){
   requireRole(user,['ADMIN','SALES','MANAGER']);
   const {project:p}=await this.access(user,d.id);
   assert(p.status!=='Cancelled','Cancelled projects are read-only.');
   assert(Number.isInteger(d.version)&&d.version===p.version,'Project changed. Refresh and try again.',409);
   const clock=new Date();
   const input=d.quick===true?{...d,eventDate:clock.toLocaleDateString('en-CA',{timeZone:'Asia/Kolkata'})}:d;
   if(d.quick===true&&d.stepId==='installation'&&d.status==='Completed')assert(p.data.phases.filter(phase=>phase.name!=='Quality inspection').every(phase=>phase.status==='Completed'),'Complete the installation phases first.');
   const tracking=updateApplicationTracking(p.data.tracking,input,user,clock,d.quick===true);
   const changeId=uid('TRACK');tracking.changeId=changeId;
   const at=now();
   const results=await this.db.batch([
    this.stmt('UPDATE projects SET data=?,updated_at=?,version=version+1 WHERE id=? AND version=?',JSON.stringify({...p.data,tracking}),at,p.id,p.version),
    ...(input.applicationNumber!==undefined?[this.stmt("UPDATE leads SET data=json_set(data,'$.applicationNumber',?),updated_at=?,version=version+1 WHERE id=? AND EXISTS(SELECT 1 FROM projects WHERE id=? AND version=? AND json_extract(data,'$.tracking.changeId')=?)",tracking.applicationNumber,at,p.lead_id,p.id,p.version+1,changeId)]:[]),
    this.stmt("INSERT INTO audit(id,actor_id,entity_id,action,detail,created_at) SELECT ?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM projects WHERE id=? AND version=? AND json_extract(data,'$.tracking.changeId')=?)",uid('LOG'),user.id,p.id,action,JSON.stringify({stepId:d.stepId,status:d.status,applicationNumber:tracking.applicationNumber,eventDate:input.eventDate,reference:input.reference,note:input.note}),at,p.id,p.version+1,changeId)
   ]);
   assert(results[0].meta.changes===1,'Project changed. Refresh and try again.',409);
   return p.id;
  }
  if(action==='project.update'){
   requireRole(user,['ADMIN','MANAGER','TECHNICAL']);const {project:p}=await this.access(user,d.id);assert(!['Completed','Cancelled'].includes(p.status),'Completed or cancelled projects are read-only.');
   assert(!d.version||d.version===p.version,'Project changed. Refresh and try again.',409);let data={...p.data};let status=p.status;let manager=p.manager_id,tech=p.technician_id,verifier=p.verifier_id;
   if(d.assignment){requireRole(user,['ADMIN']);for(const [field,role] of [['managerId','MANAGER'],['technicianId','TECHNICAL'],['verifierId','VERIFIER']]){if(d.assignment[field])assert(await this.one('SELECT id FROM users WHERE id=? AND role=? AND status=?',d.assignment[field],role,'Active'),`Choose an active ${role.toLowerCase()}.`);}manager=d.assignment.managerId||manager;tech=d.assignment.technicianId||tech;verifier=d.assignment.verifierId||verifier;}
   if(d.subsidyStatus!==undefined){
    const subsidyStatus=z.enum(['Pending','Processing','Completed']).parse(d.subsidyStatus);
    const note=z.string().trim().max(2000).parse(d.subsidyNote||'');
    const handoverIndex=data.phases.findIndex(phase=>phase.name==='Customer handover');
    if(subsidyStatus!=='Pending')assert(handoverIndex>=0&&data.phases.slice(0,handoverIndex).filter(phase=>phase.name!=='Quality inspection').every(phase=>phase.status==='Completed'),'Complete the previous installation phases first.');
    const entry={status:subsidyStatus,note,by:user.id,updatedBy:user.name,at:now()};
    data.subsidy={...entry,history:[...(data.subsidy?.history||[]),entry]};
   }
   if(d.phase!==undefined){
    const n=z.number().int().min(0).max(data.phases.length-1).parse(d.phase);
    assert(data.phases[n].name!=='Quality inspection','Quality inspection is no longer part of the installation timeline.');
    const phaseStatus=z.enum(['Pending','Processing','Completed']).parse(d.phaseStatus||'Completed');
    if(phaseStatus!=='Pending')assert(data.phases.slice(0,n).filter(phase=>phase.name!=='Quality inspection').every(phase=>phase.status==='Completed'),'Complete the previous installation phase first.');
    if(phaseStatus!=='Completed')assert(data.phases.slice(n+1).filter(phase=>phase.name!=='Quality inspection').every(phase=>phase.status==='Pending'),'Reset later installation phases to Pending first.');
    const evidence=d.phaseStatus!==undefined?z.string().trim().max(2000).parse(d.evidence||''):str.parse(d.evidence);
    if(d.phaseStatus!==undefined&&data.phases[n].name==='Customer handover'){
     requireRole(user,['ADMIN','MANAGER']);
     if(phaseStatus==='Completed')assert(evidence,'Add the customer acknowledgement in this row.');
     data.handover=phaseStatus==='Completed';data.handoverEvidence=phaseStatus==='Completed'?evidence:'';
    }
    const previous=data.phases[n];const entry={status:phaseStatus,evidence,by:user.id,updatedBy:user.name,at:now()};
    data.phases=[...data.phases];data.phases[n]={...previous,...entry,history:[...(previous.history||(previous.at?[{status:previous.status,evidence:previous.evidence,by:previous.by,at:previous.at}]:[])),entry]};
    if(d.phaseStatus!==undefined&&!['On Hold','Delayed'].includes(status))status='Installation';
   }
   if(d.quality){requireRole(user,['ADMIN','MANAGER']);assert(['Passed','Failed'].includes(d.quality),'Invalid quality result.');assert(d.note?.trim(),'Record the quality inspection findings.');data.quality=d.quality;data.qualityReport={note:d.note,by:user.id,at:now()};}
   if(d.handover){requireRole(user,['ADMIN','MANAGER']);data.handover=true;data.handoverEvidence=str.parse(d.evidence);}
   if(d.requiredApprovals){requireRole(user,['ADMIN','MANAGER']);data.requiredApprovals=z.array(str.max(100)).max(15).parse(d.requiredApprovals);assert(data.finance!=='Finance'||data.requiredApprovals.includes('Bank approval'),'Finance projects must retain bank approval.');}
   if(d.dueDate!==undefined)data.dueDate=z.string().max(30).parse(d.dueDate);
   if(d.status){status=z.enum(PROJECT_STAGES).parse(d.status);if(['On Hold','Delayed','Cancelled'].includes(status))assert(d.note?.trim(),'Add a reason.');if(status==='Completed'){requireRole(user,['ADMIN','MANAGER']);const rs=await this.all('SELECT * FROM records WHERE project_id=?',p.id);assertCompletion({...p,data},rs,await this.settings());data.completedAt=now();}}
   if(d.note)data.notes=[...(data.notes||[]),{note:z.string().max(4000).parse(d.note),at:now(),by:user.name}];
   const res=await this.run('UPDATE projects SET manager_id=?,technician_id=?,verifier_id=?,status=?,data=?,updated_at=?,version=version+1 WHERE id=? AND version=?',manager,tech,verifier,status,JSON.stringify(data),now(),p.id,p.version);assert(res.meta.changes===1,'Project changed. Refresh and try again.',409);await this.audit(user,p.id,action,{from:p.status,to:status,phase:d.phase,phaseStatus:d.phaseStatus,subsidyStatus:d.subsidyStatus,subsidyNote:d.subsidyNote,note:d.note}).run();await this.notifyProject(p.id,`Project updated: ${status} · ${p.id}`);return p.id;
  }
  if(action==='incentive.create'){
   requireRole(user,['ADMIN']);const {project:p,lead:l}=await this.access(user,d.projectId);assert(p.status==='Completed','Complete the project and all quality checks before calculating commission.');assert(l.partner_id,'This project has no referring partner.');const settings=await this.settings();assert(settings.incentivePerKw>0,'Configure the company incentive per kW in Settings.');const amount=Math.round(settings.incentivePerKw*p.data.capacity*100);return this.createRecord(user,'incentive',p.id,'Expected',{partnerId:l.partner_id,capacity:p.data.capacity,ruleSnapshot:{perKw:settings.incentivePerKw,capturedAt:now()},projectId:p.id},amount,p.id);
  }
  if(action==='payout.create'){
   requireRole(user,['ADMIN','FINANCE']);const r=await this.one("SELECT * FROM records WHERE id=? AND kind='incentive'",d.incentiveId);assert(r?.status==='Approved','Only approved incentives can be made payable.');await this.access(user,r.project_id);return this.createRecord(user,'payout',r.project_id,'Pending',{partnerId:r.data.partnerId,incentiveId:r.id,method:d.method||'Bank transfer'},r.amount,r.id);
  }
  throw new BusinessError('Unknown action.',400);
 }
 async upload(user,{projectId,documentType,name,mime,size,key}){
  if(!projectId&&documentType==='Partner KYC'){assert(user.role==='PARTNER'&&['Pending','Active'].includes(user.status),'Only partners may submit their KYC.',403);return this.createRecord(user,'kyc',null,'Submitted',{name,documentType,mime,size,fileKey:key,uploadedBy:user.name});}
  const {project}=await this.access(user,projectId);requireRole(user,['ADMIN','CUSTOMER','PARTNER','MANAGER','TECHNICAL','VERIFIER','FINANCE']);
  assert(project.status!=='Cancelled','Documents cannot be added to cancelled projects.');
  return this.createRecord(user,'document',projectId,'Submitted',{name,documentType,mime,size,fileKey:key,uploadedBy:user.name});
 }
 async fileAccess(user,id){const r=await this.one("SELECT * FROM records WHERE id=? AND kind IN ('document','kyc')",id);assert(r,'Document not found.',404);if(r.kind==='kyc'){assert(user.role==='ADMIN'||r.owner_id===user.id,'KYC access denied.',403);return r;}await this.access(user,r.project_id);assert(user.role!=='PARTNER'||r.owner_id===user.id,'Partners may only download documents they uploaded.',403);return r;}
}
export function errorResponse(e){if(e instanceof z.ZodError)return {error:e.issues.map(i=>`${i.path.join('.')}: ${i.message}`).join('; '),status:400};if(e instanceof BusinessError||e?.status===413)return {error:e.message,status:e.status};if(String(e).includes('UNIQUE constraint'))return {error:'This record already exists. Duplicate submissions are not permitted.',status:409};console.error(e);return {error:'The request could not be completed. Please try again.',status:500};}
