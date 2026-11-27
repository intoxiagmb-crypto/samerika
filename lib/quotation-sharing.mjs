import {randomBytes, createHash} from 'node:crypto';
import {Business} from './business.mjs';
import {assert,requireRole} from './policy.mjs';
import {whatsappNumber} from './quotation-policy.mjs';
const prefix='quotation-share:';
const keyFor=token=>prefix+createHash('sha256').update(token).digest('hex');
const shareable=quote=>['Sent','Accepted'].includes(quote.status);
async function authorizedQuote(db,user,id){
 requireRole(user,['ADMIN','SALES','MANAGER','PARTNER']);
 assert(typeof id==='string'&&id.length>0&&id.length<=100,'Select a quotation.');
 const service=new Business(db);
 const quote=await service.one("SELECT * FROM records WHERE id=? AND kind='quote'",id);
 assert(quote,'Quotation not found.',404);
 await service.access(user,quote.project_id);
 return {service,quote};
}
export async function createQuotationShare(db,user,id,now=Date.now()){
 const {service,quote}=await authorizedQuote(db,user,id);
 await service.limit(user.id);
 assert(shareable(quote),'The company administrator must approve and publish this quotation before sharing.');
 assert(whatsappNumber(quote.data.customerDetails?.mobile),'The quotation needs a valid customer mobile number before WhatsApp sharing.');
 const expiresAt=Math.min(now+30*86400000,Date.parse(quote.data.validUntil+'T23:59:59+05:30'));
 assert(Number.isFinite(expiresAt)&&expiresAt>now,'This quotation has expired. Create a new quotation before sharing.');
 const token=randomBytes(32).toString('hex');
 await db.batch([
  db.prepare('INSERT INTO settings(key,data) VALUES(?,?)').bind(keyFor(token),JSON.stringify({quoteId:id,createdBy:user.id,expiresAt})),
  service.audit(user,id,'quote.share_created',{expiresAt,channel:'WhatsApp',delivery:'Not confirmed'}),
 ]);
 return {path:'/quotation/'+token,expiresAt};
}
export async function revokeQuotationShares(db,user,id){
 const {service}=await authorizedQuote(db,user,id);
 requireRole(user,['ADMIN']);
 await db.batch([
  db.prepare("DELETE FROM settings WHERE key LIKE 'quotation-share:%' AND json_extract(data,'$.quoteId')=?").bind(id),
  service.audit(user,id,'quote.shares_revoked',{}),
 ]);
}
const pick=(object,keys)=>Object.fromEntries(keys.filter(key=>object?.[key]!==undefined).map(key=>[key,object[key]]));
export async function getSharedQuotation(db,token,now=Date.now()){
 if(!/^[a-f0-9]{64}$/.test(token))return null;
 const row=await db.prepare('SELECT data FROM settings WHERE key=?').bind(keyFor(token)).first();
 if(!row)return null;
 const share=JSON.parse(row.data);
 if(share.expiresAt<=now)return null;
 const quote=await new Business(db).one("SELECT * FROM records WHERE id=? AND kind='quote'",share.quoteId);
 if(!quote||!shareable(quote))return null;
 const project=await new Business(db).one('SELECT * FROM projects WHERE id=?',quote.project_id);
 if(!project||project.data.deletedAt)return null;
 const data=pick(quote.data,['customer','validUntil','terms','priceTaxMode','taxMode','supplierState','supplierStateCode','placeOfSupply','placeOfSupplyCode','capacity','unitPrice','installation','discount','itemsSubtotal','discountAmount','subtotal','taxRate','tax','total']);
 data.company=pick(quote.data.company,['name','tagline','address','gstin','state','phone','email','bankDetails']);
 data.customerDetails=pick(quote.data.customerDetails,['name','address','city','state','pin','mobile','email']);
 if(quote.data.items)data.items=quote.data.items.map(line=>pick(line,['name','description','warranty','hsn','quantity','unit','unitPrice','taxRate','taxableAmount','amount','tax','total']));
 if(quote.data.product)data.product=pick(quote.data.product,['name','description','warranty']);
 return {id:quote.id,status:quote.status,created_at:quote.created_at,data};
}
