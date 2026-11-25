import { assert } from './policy.mjs';

// Prices and totals are in paise. Shared by the preview and the server.
export function itemQuoteTotal(items, { installation = 0, discount = 0, taxRate = 0 } = {}) {
  assert(Array.isArray(items) && items.length > 0 && items.length <= 100, 'Select between 1 and 100 items.');
  for (const n of [installation, discount, taxRate]) assert(Number.isFinite(n) && n >= 0, 'Enter valid positive amounts.');
  assert(taxRate <= 100, 'Invalid tax rate.');
  const lines = items.map(item => {
    assert(Number.isSafeInteger(item.unitPrice) && item.unitPrice > 0, 'Invalid item price.');
    assert(Number.isFinite(item.quantity) && item.quantity > 0 && item.quantity <= 10000 && Math.abs(item.quantity * 1000 - Math.round(item.quantity * 1000)) < 1e-7, 'Quantity must be greater than zero, at most 10,000, with up to 3 decimals.');
    const rate = item.taxRate ?? taxRate;
    assert(Number.isFinite(rate) && rate >= 0 && rate <= 100, 'Invalid item tax rate.');
    return { ...item, taxRate: rate, amount: Math.round(item.unitPrice * item.quantity) };
  });
  const itemsSubtotal = lines.reduce((sum, item) => sum + item.amount, 0);
  const installationAmount = Math.round(installation * 100), discountAmount = Math.round(discount * 100);
  const subtotal = itemsSubtotal + installationAmount - discountAmount;
  assert(subtotal >= 0, 'Discount exceeds the quotation subtotal.');
  const taxableLines = [...lines, ...(installationAmount ? [{ name: 'Installation charges', hsn: '', quantity: 1, unit: 'Job', unitPrice: installationAmount, amount: installationAmount, taxRate }] : [])];
  const gross = itemsSubtotal + installationAmount;
  let allocatedDiscount = 0, cumulative = 0;
  for (const line of taxableLines) {
    cumulative += line.amount;
    const nextDiscount = gross ? Math.round(discountAmount * cumulative / gross) : 0;
    line.discount = nextDiscount - allocatedDiscount;
    allocatedDiscount = nextDiscount;
    line.taxableAmount = line.amount - line.discount;
    line.tax = Math.round(line.taxableAmount * line.taxRate / 100);
    line.total = line.taxableAmount + line.tax;
  }
  const tax = taxableLines.reduce((sum, line) => sum + line.tax, 0), total = subtotal + tax;
  assert(Number.isSafeInteger(total) && total <= 1e12, 'Quotation amount is too large.');
  return { items: taxableLines, itemsSubtotal, installationAmount, discountAmount, subtotal, taxRate, tax, total };
}

export function rupeesInWords(paise) {
  const ones = ['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function words(n) {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + words(n % 10) : '');
    for (const [value, label] of [[10000000,'Crore'],[100000,'Lakh'],[1000,'Thousand'],[100,'Hundred']]) {
      if (n >= value) return words(Math.floor(n / value)) + ' ' + label + (n % value ? ' ' + words(n % value) : '');
    }
  }
  return words(Math.floor(paise / 100)) + ' Rupees' + (paise % 100 ? ' and ' + words(paise % 100) + ' Paise' : '') + ' Only';
}
