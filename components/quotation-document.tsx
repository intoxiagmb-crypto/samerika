import Image from 'next/image';
import { COMPANY_NAME } from '@/lib/brand';
import { rupeesInWords } from '@/lib/quotation.mjs';
// The business API exposes heterogeneous JSON records, including historical quotations.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
export const quoteMoney = (value: number) => new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format((value || 0) / 100);
const date = (value: string) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export default function QuotationDocument({ quote, settings }: { quote: Row; settings: Row }) {
  const d = quote.data, snapshot = d.company || { name: settings.company, email: settings.contactEmail, phone: settings.contactPhone };
  const c = { ...snapshot, name: snapshot.name === 'Solaris' ? COMPANY_NAME : snapshot.name };
  const customer = d.customerDetails || { name: d.customer };
  const lines: Row[] = d.items || [{ name: d.product?.name || 'Solar system', description: d.product?.description, warranty: d.product?.warranty, quantity: d.capacity, unit: 'kW', unitPrice: Math.round(d.unitPrice * 100), amount: Math.round(d.unitPrice * 100 * d.capacity), taxRate: d.taxRate, tax: d.tax, total: d.total }];
  const groups = new Map<string, Row>();
  for (const line of lines) {
    const key = `${line.hsn || ''}:${line.taxRate}`;
    const group = groups.get(key) || { hsn: line.hsn || '—', rate: line.taxRate, taxable: 0, tax: 0 };
    group.taxable += line.taxableAmount ?? d.subtotal;
    group.tax += line.tax;
    groups.set(key, group);
  }
  const interstate = d.taxMode === 'IGST';
  return <article className="quotation-paper" aria-label="Quotation preview">
    <header className="quotation-letterhead"><Image className="quotation-company-logo" src="/brand/samerika-logo.svg" alt="Samerika Power Private Limited" width={1175} height={965} unoptimized/><div className="quotation-company-info"><span className="quotation-kicker">SOLAR ENERGY SOLUTIONS</span><h2>{c.name}</h2>{c.tagline && <p>{c.tagline}</p>}{c.address && <p className="preserve-lines">{c.address}</p>}<p>{[c.phone, c.email].filter(Boolean).join(' · ')}</p>{(c.gstin || c.state) && <p>{[c.gstin && `GSTIN: ${c.gstin}`, c.state].filter(Boolean).join(' · ')}</p>}</div><div className="quotation-title"><h3>QUOTATION</h3><span>{quote.status || 'Draft'}</span></div></header>
    <section className="quotation-parties"><div><h4>QUOTATION FOR</h4><strong>{customer.name || 'Select a customer'}</strong><p>{[customer.address, customer.city, customer.state, customer.pin].filter(Boolean).join(', ')}</p>{customer.mobile && <p>Contact: {customer.mobile}</p>}{customer.email && <p>{customer.email}</p>}</div><div><p><b>Quotation no.</b><span>{quote.id || 'Assigned on save'}</span></p><p><b>Date</b><span>{date(quote.created_at || new Date().toISOString())}</span></p><p><b>Valid until</b><span>{date(d.validUntil)}</span></p></div></section>
    <div className="quotation-table-scroll"><table className="quotation-items"><thead><tr><th>#</th><th>Item / description</th><th>HSN / SAC</th><th>Qty</th><th>Unit</th><th>Rate (₹)</th><th>GST (₹)</th><th>Amount (₹)</th></tr></thead><tbody>{lines.map((line, i) => <tr key={i}><td>{i + 1}</td><td><strong>{line.name}</strong>{line.description && <p className="preserve-lines">{line.description}</p>}{line.warranty && <p>Warranty: {line.warranty}</p>}</td><td>{line.hsn || '—'}</td><td>{line.quantity}</td><td>{line.unit}</td><td>{quoteMoney(line.unitPrice)}</td><td>{quoteMoney(line.tax)}<small>{line.taxRate}%</small></td><td>{quoteMoney(line.total)}</td></tr>)}</tbody></table></div>
    {!!d.discountAmount && <p className="quotation-footnote">Discount of ₹{quoteMoney(d.discountAmount)} is allocated across items before GST.</p>}
    {!d.items && <p className="quotation-footnote">Installation: ₹{quoteMoney((d.installation || 0) * 100)} · Discount: ₹{quoteMoney((d.discount || 0) * 100)}</p>}
    <section className="quotation-bottom"><div><h4>TAX SUMMARY</h4><table className="quotation-tax"><thead><tr><th>HSN / SAC</th><th>Taxable (₹)</th>{interstate ? <th>IGST (₹)</th> : <><th>CGST (₹)</th><th>SGST (₹)</th></>}<th>Tax (₹)</th></tr></thead><tbody>{Array.from(groups.entries()).map(([key, g]) => <tr key={key}><td>{g.hsn}</td><td>{quoteMoney(g.taxable)}</td>{interstate ? <td>{quoteMoney(g.tax)}<small>{g.rate}%</small></td> : <><td>{quoteMoney(Math.round(g.tax / 2))}<small>{g.rate / 2}%</small></td><td>{quoteMoney(g.tax - Math.round(g.tax / 2))}<small>{g.rate / 2}%</small></td></>}<td>{quoteMoney(g.tax)}</td></tr>)}</tbody></table></div><div className="quotation-totals"><p><span>Items subtotal</span><b>₹{quoteMoney(d.itemsSubtotal ?? (d.subtotal - (d.installation || 0) * 100 + (d.discount || 0) * 100))}</b></p>{!!d.installation && <p><span>Installation</span><b>₹{quoteMoney(d.installation * 100)}</b></p>}{!!d.discount && <p><span>Discount</span><b>− ₹{quoteMoney(d.discount * 100)}</b></p>}<p><span>Taxable amount</span><b>₹{quoteMoney(d.subtotal)}</b></p><p><span>Total GST</span><b>₹{quoteMoney(d.tax)}</b></p><p className="quotation-grand-total"><span>Total</span><b>₹{quoteMoney(d.total)}</b></p></div></section>
    <p className="quotation-words"><b>Amount in words</b><span>{rupeesInWords(d.total)}</span></p>
    <section className="quotation-terms"><h4>TERMS & CONDITIONS</h4><p className="preserve-lines">{d.terms || 'Payment schedule and scope to be agreed in writing.'}</p></section>
    <footer className="quotation-signoff"><div><h4>BANK DETAILS</h4><p className="preserve-lines">{c.bankDetails || 'Contact the company for payment details.'}</p></div><div><b>For {c.name}</b><div className="signature-space"/><span>Authorized signatory</span></div></footer>
  </article>;
}
