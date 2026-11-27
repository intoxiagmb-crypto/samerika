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

test('tax-inclusive prices extract GST without adding it again; exclusive remains the default',()=>{
 const items=[{unitPrice:11800,quantity:1,taxRate:18}];
 const inclusive=itemQuoteTotal(items,{priceTaxMode:'inclusive'});
 assert.equal(inclusive.subtotal,10000);assert.equal(inclusive.tax,1800);assert.equal(inclusive.total,11800);
 assert.equal(inclusive.items[0].unitPrice,11800);
 const exclusive=itemQuoteTotal(items,{priceTaxMode:'exclusive'});
 assert.equal(exclusive.subtotal,11800);assert.equal(exclusive.tax,2124);assert.equal(exclusive.total,13924);
 assert.deepEqual(itemQuoteTotal(items),exclusive);
 assert.throws(()=>itemQuoteTotal(items,{priceTaxMode:'invalid'}),/Tax Included or Tax Excluded/);
});

test('inclusive mixed GST, installation, discounts and fractional quantities reconcile to paise',()=>{
 const items=[{unitPrice:10500,quantity:1.125,taxRate:5},{unitPrice:11800,quantity:2,taxRate:18},{unitPrice:2000,quantity:1,taxRate:0}];
 for(const discount of [0,1.01,384.13]){
  const result=itemQuoteTotal(items,{priceTaxMode:'inclusive',installation:10,taxRate:18,discount});
  assert.equal(result.total,result.itemsSubtotal+1000-Math.round(discount*100));
  assert.equal(result.items.reduce((sum,line)=>sum+line.taxableAmount,0),result.subtotal);
  assert.equal(result.items.reduce((sum,line)=>sum+line.discount,0),Math.round(discount*100));
  assert.equal(result.items.reduce((sum,line)=>sum+line.tax,0),result.tax);
  assert.equal(result.subtotal+result.tax,result.total);
  for(const line of result.items){assert.equal(line.taxableAmount+line.tax,line.total);assert.ok(Number.isSafeInteger(line.total));}
  assert.equal(result.items[2].tax,0);
 }
 assert.equal(itemQuoteTotal([{unitPrice:11800,quantity:1,taxRate:18}],{priceTaxMode:'inclusive',discount:118}).total,0);
 assert.throws(()=>itemQuoteTotal(items,{priceTaxMode:'inclusive',discount:9999}),/Discount exceeds/);
});

test('mixed product tax settings reconcile without adding GST twice',()=>{
 const result=itemQuoteTotal([
  {unitPrice:11800,quantity:2,taxRate:18,priceTaxMode:'inclusive'},
  {unitPrice:10000,quantity:1,taxRate:5,priceTaxMode:'exclusive'},
  {unitPrice:1000,quantity:1,taxRate:0,priceTaxMode:'inclusive'},
 ]);
 assert.equal(result.priceTaxMode,'mixed');
 assert.equal(result.subtotal,31000);assert.equal(result.tax,4100);assert.equal(result.total,35100);
 assert.deepEqual(result.items.map(line=>line.total),[23600,10500,1000]);
 assert.deepEqual(result.items.map(line=>line.priceTaxMode),['inclusive','exclusive','inclusive']);
 assert.throws(()=>itemQuoteTotal([{unitPrice:10000,quantity:1,priceTaxMode:'mixed'}]),/each item/);
 const fractional=itemQuoteTotal([{unitPrice:10501,quantity:1.125,taxRate:5,priceTaxMode:'inclusive'},{unitPrice:9999,quantity:2.123,taxRate:18,priceTaxMode:'exclusive'}]);
 assert.equal(fractional.items[0].total,Math.round(10501*1.125));
 assert.equal(fractional.items[1].total,Math.round(9999*2.123)+Math.round(Math.round(9999*2.123)*.18));
 assert.equal(fractional.subtotal+fractional.tax,fractional.total);
});
