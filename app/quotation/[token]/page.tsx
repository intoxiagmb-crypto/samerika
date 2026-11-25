import type {Metadata} from 'next';
import QuotationDocument from '@/components/quotation-document';
import {QuotationPrintButton} from '@/components/quotation-actions';
import {getDatabase} from '@/lib/database.mjs';
import {getSharedQuotation} from '@/lib/quotation-sharing.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Your quotation — Samerika Power',robots:{index:false,follow:false},referrer:'no-referrer'};
export default async function SharedQuotation({params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 const quote=await getSharedQuotation(getDatabase(),token);
 if(!quote)return <main className="quotation-share-page"><h1>Quotation link unavailable</h1><p>This link has expired or been revoked, or the quotation is no longer published. Please ask your company contact for a new link.</p></main>;
 return <main className="quotation-share-page"><header className="quotation-share-toolbar"><div><h1>Your quotation</h1><p>Print or save as an A4 PDF. This link is private to its recipients.</p></div><QuotationPrintButton/></header><QuotationDocument quote={quote} settings={{}}/></main>;
}
