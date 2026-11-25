import test from 'node:test';
import assert from 'node:assert/strict';
import {quotationTaxLocation,resolveIndianState,quotationWhatsAppUrl,whatsappNumber} from '../lib/quotation-policy.mjs';

test('GST follows normalized supplier and installation states, including union territories',()=>{
 assert.equal(quotationTaxLocation({state:'ODISHA'},{state:'Orissa'}).taxMode,'CGST_SGST');
 assert.equal(quotationTaxLocation({state:'Odisha'},{state:'WB'}).taxMode,'IGST');
 assert.equal(quotationTaxLocation({gstin:'21ABCDE1234F1Z5'},{state:'21'}).taxMode,'CGST_SGST');
 assert.equal(quotationTaxLocation({state:'Chandigarh'},{state:'CH'}).taxMode,'CGST_UTGST');
 assert.equal(quotationTaxLocation({state:'Delhi'},{state:'New Delhi'}).taxMode,'CGST_SGST');
 assert.equal(resolveIndianState('Andhra Pradesh').code,'37');
 for(const state of ['','Atlantis','North India'])assert.throws(()=>quotationTaxLocation({state:'Odisha'},{state}),/installation\/site state/);
 assert.throws(()=>quotationTaxLocation({},{state:'Odisha'}),/company state/);
 assert.throws(()=>quotationTaxLocation({state:'Odisha',gstin:'08ABCDE1234F1Z5'},{state:'Odisha'}),/do not match/);
 assert.throws(()=>quotationTaxLocation({gstin:'21WRONG'},{state:'Odisha'}),/GSTIN/);
});
test('WhatsApp uses saved customer number and URL-encodes the quotation message',()=>{
 assert.equal(whatsappNumber('98765 43210'),'919876543210');
 assert.equal(whatsappNumber('+91 (98765) 43210'),'919876543210');
 assert.equal(whatsappNumber('9876543210<script>'),null);
 const q={id:'Q-1',data:{customerDetails:{name:'A & B',mobile:'9876543210'},company:{name:'Test Solar'},total:12345}};
 const url=new URL(quotationWhatsAppUrl(q,'https://example.test/quotation/secret'));
 assert.equal(url.pathname,'/919876543210');
 assert.ok(url.searchParams.get('text').includes('A & B'));
 assert.ok(url.searchParams.get('text').includes('https://example.test/quotation/secret'));
 assert.equal(url.searchParams.size,1);
});
