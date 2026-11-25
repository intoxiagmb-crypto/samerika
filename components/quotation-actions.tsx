'use client';
import {useState} from 'react';
import {Download,MessageCircle,Link2,LoaderCircle} from 'lucide-react';
import {quotationWhatsAppUrl,whatsappNumber} from '@/lib/quotation-policy.mjs';
// Stored historical quotations have heterogeneous JSON data.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row=Record<string,any>;
export function QuotationPrintButton(){return <button className="button button-secondary quotation-print-button" onClick={()=>window.print()}><Download size={16}/> Print / save A4 PDF</button>;}
export default function QuotationActions({quote,role}:{quote:Row;role:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[share,setShare]=useState<{url:string;whatsapp:string;expiresAt:number}|null>(null),[notice,setNotice]=useState('');
 const permitted=['ADMIN','SALES','MANAGER','PARTNER'].includes(role);
 const ready=['Sent','Accepted'].includes(quote.status);
 const phone=whatsappNumber(quote.data.customerDetails?.mobile);
 async function prepare(){
  setBusy(true);setError('');setNotice('');
  try{
   const r=await fetch('/api/business',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'quote.share',data:{id:quote.id}})});
   const result=await r.json() as {error?:string;path:string;expiresAt:number};if(!r.ok)throw new Error(result.error||'Unable to prepare quotation link.');
   const url=new URL(result.path,window.location.origin).href;
   setShare({url,whatsapp:quotationWhatsAppUrl(quote,url),expiresAt:result.expiresAt});
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 async function revoke(){
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/business',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'quote.share.revoke',data:{id:quote.id}})});
   const result=await r.json() as {error?:string;path:string;expiresAt:number};if(!r.ok)throw new Error(result.error||'Unable to revoke links.');
   setShare(null);setNotice('All shared links for this quotation have been revoked.');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="quotation-actions" aria-label="Print and share quotation"><div className="credential-actions"><QuotationPrintButton/>{permitted&&<button className="button button-glow" disabled={busy||!ready||!phone} onClick={prepare}>{busy?<LoaderCircle size={16} className="spin"/>:<MessageCircle size={16}/>} Prepare WhatsApp quotation</button>}{role==='ADMIN'&&<button className="button button-secondary" disabled={busy} onClick={revoke}>Revoke shared links</button>}</div>
 {permitted&&!ready&&<p>The company administrator must approve and publish the quotation before it can be shared.</p>}
 {permitted&&ready&&!phone&&<p>A valid customer mobile number must be saved on the quotation for WhatsApp sharing.</p>}
 {share&&<div className="quotation-share-ready"><p>Send to customer: <b>+{phone}</b>. Anyone with the link can view this quotation until {new Date(share.expiresAt).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'})}.</p><div className="credential-actions"><a className="button button-glow" href={share.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/> Open customer WhatsApp</a><button className="button button-secondary" onClick={async()=>{try{await navigator.clipboard.writeText(share.url);setNotice('Quotation link copied.');}catch{setNotice('Select and copy the quotation link below.');}}}><Link2 size={16}/> Copy quotation link</button></div><input aria-label="Quotation sharing link" readOnly value={share.url} onFocus={e=>e.target.select()}/><p>Review the prepared message and press Send in WhatsApp. The customer can open the link and save an A4 PDF. WhatsApp account availability and message delivery are not checked here.</p></div>}
 {notice&&<p role="status">{notice}</p>}{error&&<p className="alert error" role="alert">{error}</p>}
 </section>;
}
