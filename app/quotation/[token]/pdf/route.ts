import {getDatabase} from '@/lib/database.mjs';
import {sharedQuotationPdfResponse} from '@/lib/quotation-pdf.mjs';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
 const {token}=await params;
 return sharedQuotationPdfResponse(getDatabase(),token);
}
