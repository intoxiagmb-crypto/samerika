import PDFDocument from 'pdfkit';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {rupeesInWords} from './quotation.mjs';

const money=value=>new Intl.NumberFormat('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}).format((value||0)/100);
const date=value=>value?new Date(value).toLocaleDateString('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric'}):'-';
let font;
export function quotationPdf(quote){
 font ||= readFileSync(join(process.cwd(),'public/fonts/NotoSansDevanagari.ttf'));
 return new Promise((resolve,reject)=>{
  const doc=new PDFDocument({size:'A4',margin:40,font,bufferPages:true,info:{Title:`Quotation ${quote.id}`,Author:quote.data.company?.name||'Samerika Power'}});
  const chunks=[];doc.on('data',chunk=>chunks.push(chunk));doc.on('error',reject);doc.on('end',()=>resolve(Buffer.concat(chunks)));
  try{
   const d=quote.data,c=d.company||{},customer=d.customerDetails||{name:d.customer},width=515;
   const ensure=height=>{if(doc.y+height>doc.page.height-55)doc.addPage();};
   const text=(value,size=10,color='#243c56')=>{doc.fontSize(size).fillColor(color).text(String(value||''),40,doc.y,{width,lineGap:2});};
   const heading=value=>{ensure(45);doc.moveDown(.6);text(value,12,'#004a8e');doc.moveDown(.3);};
   text(c.name||'Samerika Power',21,'#004a8e');text(c.tagline,9);
   text([c.address,c.phone,c.email,c.gstin&&`GSTIN: ${c.gstin}`].filter(Boolean).join(' | '),9);
   heading('QUOTATION');text(`${quote.id}  |  ${quote.status}`,10);
   text(`Date: ${date(quote.created_at)}  |  Valid until: ${date(d.validUntil)}`,9);
   heading('CUSTOMER');text(customer.name,12);
   text([customer.address,customer.city,customer.state,customer.pin].filter(Boolean).join(', '));
   text([customer.mobile,customer.email].filter(Boolean).join(' | '));
   if(d.placeOfSupply)text(`Place of supply: ${d.placeOfSupply} (${d.placeOfSupplyCode}) | Supplier: ${d.supplierState}`,9);
   heading('ITEMS');
   const inclusive=d.priceTaxMode==='inclusive';
   text(inclusive?'Tax Included: GST is within the rates and total.':'Tax Excluded: GST is added to the rates.',9);
   doc.moveDown(.4);
   const lines=d.items||[{name:d.product?.name||'Solar system',description:d.product?.description,warranty:d.product?.warranty,quantity:d.capacity,unit:'kW',unitPrice:Math.round(d.unitPrice*100),taxRate:d.taxRate,tax:d.tax,total:d.total,taxableAmount:d.subtotal}];
   const widths=[175,35,40,85,80,100];
   const columns=['Item / HSN','Qty','Unit',`Rate ₹\n${inclusive?'incl. GST':'excl. GST'}`,'GST ₹','Amount ₹'];
   const drawRow=(cells,header=false)=>{
    doc.fontSize(9);
    const heights=cells.map((cell,i)=>doc.heightOfString(String(cell),{width:widths[i]-12,lineGap:1}));
    const height=Math.max(...heights)+16;
    if(doc.y+height>doc.page.height-55){doc.addPage();if(!header)drawRow(columns,true);}
    const y=doc.y;let x=40;
    if(header)doc.rect(x,y,width,height).fill('#e7eff8');
    cells.forEach((cell,i)=>{doc.fillColor('#243c56').text(String(cell),x+6,y+8,{width:widths[i]-12,lineGap:1});x+=widths[i];});
    doc.moveTo(40,y+height).lineTo(555,y+height).strokeColor('#d3deea').lineWidth(.5).stroke();
    doc.x=40;doc.y=y+height;
   };
   drawRow(columns,true);
   for(const line of lines)drawRow([[line.name,line.hsn&&`HSN: ${line.hsn}`].filter(Boolean).join('\n'),String(line.quantity),line.unit||'Pcs',money(line.unitPrice),`${money(line.tax)}\n(${line.taxRate}%)`,money(line.total)]);
   heading('TOTALS');
   text(`Items subtotal${inclusive?' (incl. GST)':''}: ₹${money(d.itemsSubtotal??(d.subtotal-(d.installation||0)*100+(d.discount||0)*100))}`);
   if(d.installation)text(`Installation: ₹${money(d.installation*100)}`);
   if(d.discount)text(`Discount: - ₹${money(d.discount*100)}`);
   text(`Taxable amount: ₹${money(d.subtotal)}`);
   text(`${inclusive?'GST included':'Total GST'}: ₹${money(d.tax)}`);
   text(`TOTAL: ₹${money(d.total)}`,17,'#004a8e');
   text(rupeesInWords(d.total),9);
   heading('TAX SUMMARY');
   const groups=new Map();
   for(const line of lines){const key=`${line.hsn||'-'}:${line.taxRate}`;const g=groups.get(key)||{hsn:line.hsn||'-',rate:line.taxRate,taxable:0,tax:0};g.taxable+=line.taxableAmount??d.subtotal;g.tax+=line.tax;groups.set(key,g);}
   for(const g of groups.values()){
    const taxes=d.taxMode==='IGST'?`IGST ₹${money(g.tax)}`:`CGST ₹${money(Math.round(g.tax/2))} + ${d.taxMode==='CGST_UTGST'?'UTGST':'SGST'} ₹${money(g.tax-Math.round(g.tax/2))}`;
    text(`HSN ${g.hsn} | ${g.rate}% | Taxable ₹${money(g.taxable)} | ${taxes}`,9);
   }
   if(lines.some(line=>line.description||line.warranty)){heading('PRODUCT DETAILS');for(const line of lines){if(!line.description&&!line.warranty)continue;ensure(40);text(line.name,10,'#004a8e');text(line.description,9);if(line.warranty)text(`Warranty: ${line.warranty}`,9);doc.moveDown(.3);}}
   heading('TERMS & CONDITIONS');text(d.terms||'Payment schedule and scope to be agreed in writing.',9);
   heading('BANK DETAILS');text(c.bankDetails||'Contact the company for payment details.',9);
   ensure(65);doc.moveDown();text(`For ${c.name||'Samerika Power'}`,10);text('Authorized signatory',9);
   const pages=doc.bufferedPageRange();for(let i=pages.start;i<pages.start+pages.count;i++){doc.switchToPage(i);doc.page.margins.bottom=0;doc.fontSize(8).fillColor('#64748b').text(`Quotation ${quote.id} | Page ${i+1} of ${pages.count}`,40,doc.page.height-30,{width,lineBreak:false});}
   doc.end();
  }catch(error){doc.destroy();reject(error);}
 });
}

export async function sharedQuotationPdfResponse(db,token){
 const {getSharedQuotation}=await import('./quotation-sharing.mjs');
 const quote=await getSharedQuotation(db,token);
 if(!quote)return new Response('Quotation link unavailable or expired.',{status:404,headers:{'Cache-Control':'private, no-store'}});
 const pdf=await quotationPdf(quote);
 return new Response(new Uint8Array(pdf),{headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="quotation-${quote.id.replace(/[^a-zA-Z0-9-]/g,'')}.pdf"`,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
