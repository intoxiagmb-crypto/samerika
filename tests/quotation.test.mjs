import test from 'node:test';
import assert from 'node:assert/strict';
import {itemQuoteTotal,rupeesInWords} from '../lib/quotation.mjs';
test('discount allocation, fractional units and GST rounding reconcile to paise',()=>{
 const result=itemQuoteTotal([{unitPrice:9999,quantity:1.125,taxRate:5},{unitPrice:17001,quantity:2,taxRate:18}],{installation:10,discount:1.01,taxRate:18});
 assert.equal(result.items.reduce((s,i)=>s+i.discount,0),101);
 assert.equal(result.items.reduce((s,i)=>s+i.total,0),result.total);
 assert.equal(result.items.reduce((s,i)=>s+i.taxableAmount,0),result.subtotal);
 assert.ok(Number.isSafeInteger(result.total));
 assert.equal(itemQuoteTotal([{unitPrice:100,quantity:1,taxRate:5}],{discount:1}).total,0);
 assert.throws(()=>itemQuoteTotal([{unitPrice:100,quantity:NaN}]),/Quantity/);
 assert.throws(()=>itemQuoteTotal([{unitPrice:100,quantity:1,taxRate:101}]),/tax rate/);
});
test('Indian amount in words preserves rupees and paise',()=>{
 assert.equal(rupeesInWords(46582700),'Four Lakh Sixty Five Thousand Eight Hundred Twenty Seven Rupees Only');
 assert.equal(rupeesInWords(10005),'One Hundred Rupees and Five Paise Only');
 assert.equal(rupeesInWords(0),'Zero Rupees Only');
});
