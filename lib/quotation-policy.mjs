import { brandName } from './brand-name.mjs';
import { assert } from './policy.mjs';

// GST state codes: https://docs.ewaybillgst.gov.in/apidocs/state-code.html
const definitions = [
 ['01','Jammu and Kashmir','JK|J&K'],['02','Himachal Pradesh','HP'],['03','Punjab','PB'],['04','Chandigarh','CH'],
 ['05','Uttarakhand','UK|UT|Uttaranchal'],['06','Haryana','HR'],['07','Delhi','DL|New Delhi|NCT of Delhi'],['08','Rajasthan','RJ'],
 ['09','Uttar Pradesh','UP'],['10','Bihar','BR'],['11','Sikkim','SK'],['12','Arunachal Pradesh','AR'],['13','Nagaland','NL'],
 ['14','Manipur','MN'],['15','Mizoram','MZ'],['16','Tripura','TR'],['17','Meghalaya','ML'],['18','Assam','AS'],
 ['19','West Bengal','WB'],['20','Jharkhand','JH'],['21','Odisha','OD|OR|Orissa'],['22','Chhattisgarh','CG|CT|Chattisgarh'],
 ['23','Madhya Pradesh','MP'],['24','Gujarat','GJ'],['26','Dadra and Nagar Haveli and Daman and Diu','DN|DD|Dadra and Nagar Haveli|Daman and Diu'],
 ['27','Maharashtra','MH'],['29','Karnataka','KA'],['30','Goa','GA'],['31','Lakshadweep','LD'],['32','Kerala','KL'],
 ['33','Tamil Nadu','TN'],['34','Puducherry','PY|Pondicherry'],['35','Andaman and Nicobar Islands','AN|Andaman and Nicobar'],
 ['36','Telangana','TS|TG'],['37','Andhra Pradesh','AP'],['38','Ladakh','LA'],
];
export const INDIAN_STATES = definitions.map(([code,name]) => ({code,name}));
const normalize = value => String(value || '').toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]/g,'');
export function resolveIndianState(value) {
 const key=normalize(value);
 if(!key)return null;
 const state=definitions.find(([code,name,aliases]) => [code,String(Number(code)),name,...aliases.split('|')].some(candidate=>normalize(candidate)===key));
 return state ? {code:state[0],name:state[1]} : null;
}
export function quotationTaxLocation(settings, customer) {
 const suppliedState=String(settings.state||'').trim();
 let supplier=resolveIndianState(suppliedState);
 assert(!suppliedState||supplier,'Ask the administrator to select a valid company state in Settings.');
 const gstin=String(settings.gstin||'').trim().toUpperCase();
 if(gstin){
  assert(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin),'Ask the administrator to correct the company GSTIN in Settings.');
  const registered=resolveIndianState(gstin.slice(0,2));
  assert(registered,'The company GSTIN has an unsupported state code.');
  assert(!supplier||supplier.code===registered.code,'Company state and GSTIN state do not match. Ask the administrator to correct Settings.');
  supplier=registered;
 }
 assert(supplier,'Ask the administrator to set the company state in Settings before creating a quotation.');
 const destination=resolveIndianState(customer?.state);
 assert(destination,'Select a valid installation/site state in the customer address before creating a quotation.');
 const taxMode=supplier.code!==destination.code?'IGST':['04','26','31','35','38'].includes(supplier.code)?'CGST_UTGST':'CGST_SGST';
 return {taxMode,supplierState:supplier.name,supplierStateCode:supplier.code,placeOfSupply:destination.name,placeOfSupplyCode:destination.code,taxBasis:'Customer installation/site address'};
}
export const quotationTaxLabel = mode => mode==='IGST'?'IGST':mode==='CGST_UTGST'?'CGST + UTGST':'CGST + SGST';
export const DEFAULT_QUOTATION_TERMS='Payment schedule and scope to be agreed in writing.';
export function quotationTerms(settings) { return String(settings.quotationTerms||'').trim() || DEFAULT_QUOTATION_TERMS; }
export function whatsappNumber(value) {
 const number=String(value||'').replace(/[\s()+-]/g,'');
 if(/^[6-9]\d{9}$/.test(number))return '91'+number;
 if(/^91[6-9]\d{9}$/.test(number))return number;
 return null;
}
export function quotationWhatsAppUrl(quote, shareUrl) {
 const phone=whatsappNumber(quote.data.customerDetails?.mobile);
 assert(phone,'A valid Indian customer mobile number is required for WhatsApp.');
 const total=new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(quote.data.total/100);
 const message=`Hello ${quote.data.customerDetails?.name||quote.data.customer},\n\nYour solar quotation is ready.\n*Quotation no.:* ${quote.id}\n*Total amount:* ${total}\n\nView your quotation and save/print the PDF:\n${shareUrl}\n\nRegards,\n${brandName(quote.data.company?.name)||'Samerika Power'}\nPlease keep this quotation link private.`;
 return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
