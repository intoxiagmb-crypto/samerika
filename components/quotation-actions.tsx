'use client';
import {useState} from 'react';
import {Download,MessageCircle,Link2,LoaderCircle} from 'lucide-react';
import {whatsappNumber} from '@/lib/quotation-policy.mjs';
// Stored historical quotations have heterogeneous JSON data.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row=Record<string,any>;
type Share={url:string;whatsapp:string;expiresAt:number;recipient:{name:string;phone:string}};
export function QuotationPrintButton(){return <button className="button button-secondary quotation-print-button" onClick={()=>window.print()}><Download size={16}/> Print / save A4 PDF</button>;}
export default function QuotationActions({quote,role}:{quote:Row;role:string}){
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[share,setShare]=useState<Share|null>(null),[notice,setNotice]=useState('');
 const permitted=['ADMIN','SALES','MANAGER','PARTNER'].includes(role);
 const ready=['Sent','Accepted'].includes(quote.status);
 const phone=whatsappNumber(quote.data.customerDetails?.mobile);
 async function prepare(){
  if(busy)return;
  // Open during the click so mobile browsers do not block the awaited navigation.
  const popup=window.open('about:blank','_blank');
  if(popup){popup.opener=null;popup.document.title='Opening customer WhatsApp';popup.document.body.textContent='Preparing your customer’s quotation…';}
  setBusy(true);setError('');setNotice('');setShare(null);
  try{
   const r=await fetch('/api/business',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'quote.share',data:{id:quote.id}})});
   const result=await r.json() as Share & {error?:string};if(!r.ok)throw new Error(result.error||'Unable to prepare quotation link.');
   if(!result.whatsapp||!result.url||!result.recipient?.phone)throw new Error('Unable to prepare customer WhatsApp. Please try again.');
   setShare(result);
   if(popup&&!popup.closed){popup.location.replace(result.whatsapp);setNotice('Customer WhatsApp opened. Review the message and press Send there.');}
   else setNotice('Your quotation is ready. Use Open customer WhatsApp below to continue.');
  }catch(e){if(popup&&!popup.closed)popup.close();setError((e as Error).message);}finally{setBusy(false);}
 }
 async function revoke(){
  setBusy(true);setError('');
  try{
   const r=await fetch('/api/business',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'quote.share.revoke',data:{id:quote.id}})});
   const result=await r.json() as {error?:string;path:string;expiresAt:number};if(!r.ok)throw new Error(result.error||'Unable to revoke links.');
   setShare(null);setNotice('All shared links for this quotation have been revoked.');
  }catch(e){setError((e as Error).message);}finally{setBusy(false);}
 }
 return <section className="quotation-actions" aria-label="Print and share quotation"><div className="credential-actions"><QuotationPrintButton/>{permitted&&<button className="button button-glow" disabled={busy||!ready||!phone} onClick={prepare}>{busy?<LoaderCircle size={16} className="spin"/>:<MessageCircle size={16}/>} {busy?'Opening WhatsApp…':'WhatsApp customer'}</button>}{role==='ADMIN'&&<button className="button button-secondary" disabled={busy} onClick={revoke}>Revoke shared links</button>}</div>
 {permitted&&phone&&<p>Customer: <b>{quote.data.customerDetails?.name||quote.data.customer}</b> · WhatsApp: <b>+{phone}</b></p>}
 {permitted&&!ready&&<p>Approve this quotation and mark it Sent before sharing it on WhatsApp.</p>}
 {permitted&&ready&&!phone&&<p>A valid customer mobile number must be saved on the quotation for WhatsApp sharing.</p>}
 {share&&<div className="quotation-share-ready"><p>Send to <b>{share.recipient.name}</b>: <b>+{share.recipient.phone}</b>. Anyone with the link can view this quotation until {new Date(share.expiresAt).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata'})}.</p><div className="credential-actions"><a className="button button-glow" href={share.whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={16}/> Open customer WhatsApp</a><button className="button button-secondary" onClick={async()=>{try{await navigator.clipboard.writeText(share.url);setNotice('Quotation link copied.');}catch{setNotice('Select and copy the quotation link below.');}}}><Link2 size={16}/> Copy quotation link</button></div><input aria-label="Quotation sharing link" readOnly value={share.url} onFocus={e=>e.target.select()}/><p>Review the prepared message and press Send in WhatsApp. The message contains this quotation’s number, total and link. The customer can open it and save an A4 PDF.</p></div>}
 {notice&&<p role="status">{notice}</p>}{error&&<p className="alert error" role="alert">{error}</p>}
 </section>;
}
