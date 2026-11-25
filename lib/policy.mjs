export const ROLES = ['ADMIN','CUSTOMER','PARTNER','SALES','MANAGER','TECHNICAL','VERIFIER','FINANCE'];
export const PHASES = ['Site preparation','Mounting structure','Panel installation','Electrical work','Meter & grid connection','Testing & commissioning','Quality inspection','Customer handover'];
export const LEAD_STATUSES = ['New','Assigned','Contacted','Interested','Qualified','Site Survey','Quotation','Converted','Follow-up Required','On Hold','Lost','Rejected','Duplicate','Cancelled'];
export const PROJECT_STAGES = ['Survey','Quotation','Documentation','Approvals','Procurement','Installation','Quality inspection','Handover','Completed','On Hold','Delayed','Cancelled'];
export const DEFAULT_SETTINGS = { company:'Samerika Power Private Limited', tagline:'Power a brighter tomorrow.', contactEmail:'', contactPhone:'', serviceLocations:'', taxRate:0, requiredDocuments:['Electricity bill','Site photograph'], phases:PHASES, incentivePerKw:0 };
export class BusinessError extends Error { constructor(message,status=400){ super(message); this.status=status; } }
export function assert(condition,message,status=400){if(!condition)throw new BusinessError(message,status);}
export function requireRole(user,roles){assert(user&&roles.includes(user.role)&&user.status==='Active','You do not have permission for this action.',403);}
export function canReadLead(user,lead,projects=[]){
 if(!user||user.status!=='Active')return false;
 if(user.role==='ADMIN')return true;
 if(user.role==='PARTNER')return lead.partner_id===user.id;
 if(user.role==='CUSTOMER')return lead.customer_email.toLowerCase()===user.email.toLowerCase();
 // Unassigned inbound enquiries are a shared inbox for sales and relationship staff.
 if(['SALES','MANAGER'].includes(user.role)&&!lead.assigned_to&&['Website','Channel Partner'].includes(lead.data?.source))return true;
 if(user.role==='SALES')return lead.assigned_to===user.id;
 if(user.role==='MANAGER'&&lead.assigned_to===user.id)return true;
 if(user.role==='MANAGER'&&lead.owner_id===user.id)return true;
 if(user.role==='FINANCE')return projects.some(p=>p.lead_id===lead.id);
 return projects.some(p=>p.lead_id===lead.id&&[p.manager_id,p.technician_id,p.verifier_id].includes(user.id));
}
export function quoteTotal({unitPrice,capacity,installation=0,discount=0,taxRate=0}){
 for(const n of [unitPrice,capacity,installation,discount,taxRate]) assert(Number.isFinite(n)&&n>=0,'Enter valid positive amounts.');
 assert(capacity>0&&capacity<=10000&&taxRate<=100,'Invalid capacity or tax rate.');
 const subtotal=Math.round(unitPrice*100)*capacity+Math.round(installation*100)-Math.round(discount*100);
 assert(subtotal>=0,'Discount exceeds the quotation subtotal.');
 const tax=Math.round(subtotal*taxRate/100); const total=Math.round(subtotal)+tax;
 assert(Number.isSafeInteger(total)&&total<=1e12,'Quotation amount is too large.');
 return {subtotal:Math.round(subtotal),tax,total};
}
export function assertCompletion(project,records,settings){
 const d=project.data;
 assert(records.some(r=>r.kind==='survey'&&r.status==='Approved'),'An approved site survey is required.');
 assert(records.some(r=>r.kind==='quote'&&r.status==='Accepted'),'An accepted quotation is required.');
 for(const name of settings.requiredDocuments)assert(records.some(r=>r.kind==='document'&&r.status==='Verified'&&r.data.documentType===name),`Verify the required document: ${name}.`);
 for(const name of (d.requiredApprovals||[]))assert(records.some(r=>r.kind==='approval'&&r.data.name===name&&r.status==='Approved'),`Complete the ${name} approval.`);
 assert(settings.phases.every((name,i)=>d.phases?.[i]?.status==='Completed'), 'All installation phases must be completed.');
 assert(d.quality==='Passed','Quality inspection must pass.');
 assert(d.handover&&d.handoverEvidence,'Record customer handover and its evidence.');
}
