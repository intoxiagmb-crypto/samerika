import { z } from 'zod';
import { ROLES, PHASES, LEAD_STATUSES, PROJECT_STAGES, DEFAULT_SETTINGS, BusinessError, assert, requireRole, canReadLead, quoteTotal, assertCompletion } from './policy.mjs';
const str=z.string().trim().min(1).max(2000);
const leadSchema=z.object({name:str.max(120),mobile:z.string().transform(x=>x.replace(/[^0-9]/g,'')).refine(x=>x.length===10,'Enter a 10-digit mobile number.'),email:z.string().email().max(254).transform(x=>x.toLowerCase()),address:str,city:str.max(100),state:str.max(100),pin:z.string().regex(/^\d{6}$/,'Enter a 6-digit PIN code.'),capacity:z.coerce.number().positive().max(10000),monthlyBill:z.coerce.number().min(0).max(100000000).default(0),roofArea:z.coerce.number().min(0).max(10000000).default(0),system:z.enum(['On-grid','Hybrid','Off-grid']),property:z.enum(['Residential','Commercial','Industrial']),finance:z.enum(['Cash','Finance']),remarks:z.string().max(4000).default('')});
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
 async settings(){const s=await this.one("SELECT * FROM settings WHERE key='company'");return {...DEFAULT_SETTINGS,...s?.data};}
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
 async access(user,projectId){const p=await this.one('SELECT * FROM projects WHERE id=?',projectId);assert(p,'Project not found.',404);const l=await this.one('SELECT * FROM leads WHERE id=?',p.lead_id);assert(canReadLead(user,l,[p]),'This project is not assigned to you.',403);return {project:p,lead:l};}
 async snapshot(user){
  const ps=await this.all('SELECT * FROM projects ORDER BY created_at DESC');const ls=await this.all('SELECT * FROM leads ORDER BY created_at DESC');
  const leads=ls.filter(l=>canReadLead(user,l,ps));const projects=ps.filter(p=>leads.some(l=>l.id===p.lead_id));const ids=new Set(projects.map(p=>p.id));
  const rs=await this.all('SELECT * FROM records ORDER BY created_at DESC');
  const records=rs.filter(r=>{
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
  const logs=user.role==='ADMIN'?await this.all('SELECT a.*,u.name as actor_name FROM audit a JOIN users u ON a.actor_id=u.id ORDER BY a.created_at DESC LIMIT 300'):[];
  const notifications=await this.all('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 50',user.id);
  // Internal lead notes are not disclosed to customers or partners.
  const safeLeads=leads.map(l=>['CUSTOMER','PARTNER'].includes(user.role)?{...l,data:{...l.data,internalNotes:undefined,activities:undefined}}:l);
  return {user,leads:safeLeads,projects:projects.map(p=>['CUSTOMER','PARTNER'].includes(user.role)?{...p,data:{...p.data,notes:undefined}}:p),records,users,audit:logs,notifications,settings:await this.settings()};
 }
 async notifyProject(projectId,message,staffOnly=false){
  if(!projectId)return;
  const p=await this.one('SELECT * FROM projects WHERE id=?',projectId);if(!p)return;
  const l=await this.one('SELECT * FROM leads WHERE id=?',p.lead_id);
  const users=await this.all("SELECT * FROM users WHERE status='Active'");
  const recipients=users.filter(u=>u.role==='ADMIN'||[p.manager_id,p.technician_id,p.verifier_id,l.assigned_to].includes(u.id)||!staffOnly&&(u.id===l.partner_id||u.email===l.customer_email));
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
   requireRole(user,['ADMIN']);const values=z.object({company:str.max(120),tagline:z.string().max(200),contactEmail:z.union([z.string().email(),z.literal('')]),contactPhone:z.string().max(30),serviceLocations:z.string().max(1000),taxRate:z.coerce.number().min(0).max(100),incentivePerKw:z.coerce.number().min(0).max(1000000),requiredDocuments:z.array(str.max(100)).min(1).max(20),phases:z.array(str.max(100)).length(8)}).parse(d);
   await this.db.batch([this.stmt("INSERT INTO settings(key,data) VALUES('company',?) ON CONFLICT(key) DO UPDATE SET data=excluded.data",JSON.stringify(values)),this.audit(user,'company',action,{values})]);return 'company';
  }
  if(action==='lead.create'){
   requireRole(user,['ADMIN','PARTNER','SALES','CUSTOMER','MANAGER']);const data=leadSchema.parse(d);
   if(user.role==='CUSTOMER')assert(data.email===user.email,'Use your signed-in email for your enquiry.');
   const duplicate=await this.one('SELECT id FROM leads WHERE mobile=? OR customer_email=?',data.mobile,data.email);
   assert(!duplicate,'An enquiry already exists for this mobile or email. Contact your administrator for an ownership review.',409);
   const id=uid('LEAD');const t=now();const source=user.role==='PARTNER'?'Channel Partner':user.role==='CUSTOMER'?'Website':'Manual Entry';
   const admin=await this.one("SELECT id FROM users WHERE role='ADMIN' AND status='Active' ORDER BY created_at LIMIT 1");
   const statements=[this.stmt('INSERT INTO leads(id,owner_id,partner_id,customer_email,name,mobile,assigned_to,status,data,created_at,updated_at,version) VALUES(?,?,?,?,?,?,?,?,?,?,?,1)',id,user.id,user.role==='PARTNER'?user.id:null,data.email,data.name,data.mobile,user.role==='SALES'?user.id:null,'New',JSON.stringify({...data,source,activities:[]}),t,t),this.audit(user,id,action,{source})];
   if(admin)statements.push(this.stmt('INSERT INTO notifications(id,user_id,message,entity_id,created_at) VALUES(?,?,?,?,?)',uid('N'),admin.id,`New enquiry from ${data.name}`,id,t));
   await this.db.batch(statements);return id;
  }
  if(action==='lead.update'){
   requireRole(user,['ADMIN','SALES','MANAGER']);const l=await this.one('SELECT * FROM leads WHERE id=?',d.id);assert(l,'Lead not found.',404);
   const projects=await this.all('SELECT * FROM projects WHERE lead_id=?',l.id);assert(canReadLead(user,l,projects),'This lead is not assigned to you.',403);
   const status=z.enum(LEAD_STATUSES).parse(d.status||l.status);assert(status!=='Converted','Use Convert to project.');assert(l.status!=='Converted','Manage converted leads through their project.');
   let assigned=l.assigned_to;if(d.assignedTo!==undefined){requireRole(user,['ADMIN']);const a=await this.one("SELECT id FROM users WHERE id=? AND role='SALES' AND status='Active'",d.assignedTo);assert(a,'Select an active sales employee.');assigned=a.id;}
   const note=z.string().max(4000).parse(d.note||'');if(['Lost','Rejected','Cancelled','Duplicate'].includes(status))assert(note.trim(),'Add a reason for this status.');
   const data={...l.data,followUp:d.followUp||l.data.followUp,activities:[...(l.data.activities||[]),{by:user.name,status,note,at:now()}]};
   const res=await this.run('UPDATE leads SET status=?,assigned_to=?,data=?,updated_at=?,version=version+1 WHERE id=? AND version=?',status,assigned,JSON.stringify(data),now(),l.id,d.version||l.version);assert(res.meta.changes===1,'Lead changed. Refresh and try again.',409);await this.audit(user,l.id,action,{from:l.status,to:status,note}).run();return l.id;
  }
  if(action==='project.create'){
   requireRole(user,['ADMIN','SALES','MANAGER']);const l=await this.one('SELECT * FROM leads WHERE id=?',d.leadId);assert(l,'Lead not found.',404);assert(canReadLead(user,l,[]),'This lead is not assigned to you.',403);
   assert(!['Lost','Rejected','Cancelled','Duplicate'].includes(l.status),'Requalify this lead before conversion.');
   const id=uid('SOL');const t=now();const data={name:l.name,capacity:l.data.capacity,system:l.data.system,finance:l.data.finance,address:l.data.address,city:l.data.city,amount:0,requiredApprovals:l.data.finance==='Finance'?['Bank approval']:[],phases:PHASES.map(name=>({name,status:'Pending'})),quality:'Pending',handover:false,dueDate:d.dueDate||'',notes:[]};
   try{await this.db.batch([this.stmt('INSERT INTO projects(id,lead_id,manager_id,technician_id,verifier_id,status,data,created_at,updated_at,version) VALUES(?,?,?,NULL,NULL,?,?,?,?,1)',id,l.id,user.role==='MANAGER'?user.id:null,'Survey',JSON.stringify(data),t,t),this.stmt("UPDATE leads SET status='Converted',updated_at=?,version=version+1 WHERE id=?",t,l.id),this.audit(user,id,action,{lead:l.id,partner:l.partner_id})]);}catch(e){if(String(e).includes('UNIQUE'))throw new BusinessError('This lead already has a project.',409);throw e;}return id;
  }
  if(action==='product.create'){
   requireRole(user,['ADMIN']);const p=z.object({name:str.max(150),brand:str.max(100),category:z.enum(['Solar kit','Solar panel','Inverter','Battery','Accessories']),capacity:z.coerce.number().positive().max(10000),price:z.coerce.number().positive().max(100000000),system:z.enum(['On-grid','Hybrid','Off-grid']),warranty:str.max(300),description:z.string().max(4000).default('')}).parse(d);
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
   else if(r.kind==='document'){requireRole(user,['ADMIN','VERIFIER']);assert(['Under Review','Verified','Rejected','Correction Required'].includes(status),'Invalid document status.');assert(r.data.fileKey,'Upload the document before verification.');next.review={by:user.id,at:now(),note};}
   else if(r.kind==='approval'){requireRole(user,['ADMIN','MANAGER']);assert(['Submitted','Processing','Approved','Rejected'].includes(status),'Invalid approval status.');if(status==='Approved')assert(r.data.reference&&note.trim(),'Record the approval reference and verification remarks.');}
   else if(r.kind==='incentive'){requireRole(user,['ADMIN']);assert(r.status==='Expected'&&['Approved','Rejected'].includes(status),'This incentive has already been reviewed.');next.approval={by:user.id,at:now(),note};}
   else if(r.kind==='payout'){requireRole(user,['ADMIN','FINANCE']);assert(r.status!=='Paid','A paid ledger entry cannot be overwritten.');assert(['Processing','Paid','Failed'].includes(status),'Invalid payout status.');if(status==='Paid'){assert(d.reference&&d.evidenceId,'Payment reference and uploaded evidence are required.');const ev=await this.one("SELECT * FROM records WHERE id=? AND kind='document'",d.evidenceId);assert(ev&&ev.project_id===r.project_id&&ev.data.fileKey,'Upload valid evidence for this project.');next.paymentReference=str.parse(d.reference);next.evidenceId=d.evidenceId;next.paidAt=now();next.verifiedBy=user.id;}}
   else if(r.kind==='ticket'){assert(user.role==='ADMIN'||r.owner_id===user.id||user.role==='MANAGER','Ticket access denied.',403);assert(['Open','In Progress','Resolved'].includes(status),'Invalid ticket status.');next.messages=[...(next.messages||[]),{name:user.name,note,at:now()}];}
   else if(r.kind==='product'){requireRole(user,['ADMIN']);assert(['Active','Archived'].includes(status),'Invalid product status.');}
   else throw new BusinessError('This record cannot be edited.');
   next.remarks=note;return this.updateRecord(user,r,status,next);
  }
  if(action==='quote.create'){
   requireRole(user,['ADMIN','SALES','MANAGER']);const {project:p}=await this.access(user,d.projectId);const product=await this.one("SELECT * FROM records WHERE id=? AND kind='product' AND status='Active'",d.productId);assert(product,'Select an available solar kit.');assert(product.data.category==='Solar kit','Choose a solar kit.');
   const settings=await this.settings();const details={unitPrice:product.amount/100/product.data.capacity,capacity:p.data.capacity,installation:Number(d.installation||0),discount:Number(d.discount||0),taxRate:settings.taxRate};const totals=quoteTotal(details);
   const validUntil=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(d.validUntil);assert(validUntil>=now().slice(0,10),'Quotation validity must be today or later.');
   return this.createRecord(user,'quote',p.id,'Draft',{...details,...totals,product:{...product.data},customer:p.data.name,validUntil,terms:z.string().max(4000).parse(d.terms||'Payment terms to be agreed in writing.'),version:1},totals.total);
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
  if(action==='project.update'){
   requireRole(user,['ADMIN','MANAGER','TECHNICAL']);const {project:p}=await this.access(user,d.id);assert(!['Completed','Cancelled'].includes(p.status),'Completed or cancelled projects are read-only.');
   assert(!d.version||d.version===p.version,'Project changed. Refresh and try again.',409);let data={...p.data};let status=p.status;let manager=p.manager_id,tech=p.technician_id,verifier=p.verifier_id;
   if(d.assignment){requireRole(user,['ADMIN']);for(const [field,role] of [['managerId','MANAGER'],['technicianId','TECHNICAL'],['verifierId','VERIFIER']]){if(d.assignment[field])assert(await this.one('SELECT id FROM users WHERE id=? AND role=? AND status=?',d.assignment[field],role,'Active'),`Choose an active ${role.toLowerCase()}.`);}manager=d.assignment.managerId||manager;tech=d.assignment.technicianId||tech;verifier=d.assignment.verifierId||verifier;}
   if(d.phase!==undefined){const n=z.number().int().min(0).max(7).parse(d.phase);assert(n===0||data.phases[n-1].status==='Completed','Complete the previous installation phase first.');const evidence=str.parse(d.evidence);data.phases=[...data.phases];data.phases[n]={...data.phases[n],status:'Completed',evidence,by:user.id,at:now()};}
   if(d.quality){requireRole(user,['ADMIN','MANAGER']);assert(['Passed','Failed'].includes(d.quality),'Invalid quality result.');assert(d.note?.trim(),'Record the quality inspection findings.');data.quality=d.quality;data.qualityReport={note:d.note,by:user.id,at:now()};}
   if(d.handover){requireRole(user,['ADMIN','MANAGER']);data.handover=true;data.handoverEvidence=str.parse(d.evidence);}
   if(d.requiredApprovals){requireRole(user,['ADMIN','MANAGER']);data.requiredApprovals=z.array(str.max(100)).max(15).parse(d.requiredApprovals);assert(data.finance!=='Finance'||data.requiredApprovals.includes('Bank approval'),'Finance projects must retain bank approval.');}
   if(d.dueDate!==undefined)data.dueDate=z.string().max(30).parse(d.dueDate);
   if(d.status){status=z.enum(PROJECT_STAGES).parse(d.status);if(['On Hold','Delayed','Cancelled'].includes(status))assert(d.note?.trim(),'Add a reason.');if(status==='Completed'){requireRole(user,['ADMIN','MANAGER']);const rs=await this.all('SELECT * FROM records WHERE project_id=?',p.id);assertCompletion({...p,data},rs,await this.settings());data.completedAt=now();}}
   if(d.note)data.notes=[...(data.notes||[]),{note:z.string().max(4000).parse(d.note),at:now(),by:user.name}];
   const res=await this.run('UPDATE projects SET manager_id=?,technician_id=?,verifier_id=?,status=?,data=?,updated_at=?,version=version+1 WHERE id=? AND version=?',manager,tech,verifier,status,JSON.stringify(data),now(),p.id,p.version);assert(res.meta.changes===1,'Project changed. Refresh and try again.',409);await this.audit(user,p.id,action,{from:p.status,to:status,phase:d.phase,note:d.note}).run();await this.notifyProject(p.id,`Project updated: ${status} · ${p.id}`);return p.id;
  }
  if(action==='incentive.create'){
   requireRole(user,['ADMIN']);const {project:p,lead:l}=await this.access(user,d.projectId);assert(p.status==='Completed','Complete the project and all quality checks before calculating commission.');assert(l.partner_id,'This project has no referring partner.');const settings=await this.settings();assert(settings.incentivePerKw>0,'Configure the company incentive per kW in Settings.');const amount=Math.round(settings.incentivePerKw*p.data.capacity*100);return this.createRecord(user,'incentive',p.id,'Expected',{partnerId:l.partner_id,capacity:p.data.capacity,ruleSnapshot:{perKw:settings.incentivePerKw,capturedAt:now()},projectId:p.id},amount,p.id);
  }
  if(action==='payout.create'){
   requireRole(user,['ADMIN','FINANCE']);const r=await this.one("SELECT * FROM records WHERE id=? AND kind='incentive'",d.incentiveId);assert(r?.status==='Approved','Only approved incentives can be made payable.');return this.createRecord(user,'payout',r.project_id,'Pending',{partnerId:r.data.partnerId,incentiveId:r.id,method:d.method||'Bank transfer'},r.amount,r.id);
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
