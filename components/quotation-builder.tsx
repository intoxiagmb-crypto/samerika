'use client';
import { useState } from 'react';
import { Plus, Trash2, X, FileText, LoaderCircle } from 'lucide-react';
import { itemQuoteTotal } from '@/lib/quotation.mjs';
import QuotationDocument, { quoteMoney } from './quotation-document';
// The business API exposes heterogeneous JSON records, including historical quotations.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type Selection = { key: number; productId: string; quantity: string };
export default function QuotationBuilder({ data, projectId, saving, error, onClose, onSave }: { data: Row; projectId?: string; saving: boolean; error: string; onClose: () => void; onSave: (values: Row) => void }) {
  const project = data.projects.find((p: Row) => p.id === projectId);
  const [customerId, setCustomerId] = useState(project?.lead_id || '');
  const [items, setItems] = useState<Selection[]>([{ key: 1, productId: '', quantity: '1' }]);
  const [installation, setInstallation] = useState('0'), [discount, setDiscount] = useState('0');
  const [validUntil, setValidUntil] = useState(() => new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10));
  const [terms, setTerms] = useState(data.settings.quotationTerms || 'Payment schedule and warranty as agreed in writing.');
  const [taxMode, setTaxMode] = useState('CGST_SGST');
  const products = data.records.filter((r: Row) => r.kind === 'product' && r.status === 'Active');
  const customers = data.leads.filter((l: Row) => !['Lost', 'Rejected', 'Cancelled', 'Duplicate'].includes(l.status) && !data.projects.some((p: Row) => p.lead_id === l.id && ['Completed', 'Cancelled'].includes(p.status)));
  const customer = customers.find((l: Row) => l.id === customerId);
  function update(key: number, patch: Partial<Selection>) { setItems(items.map(item => item.key === key ? { ...item, ...patch } : item)); }
  let totals: Row | null = null, validation = '';
  try {
    totals = itemQuoteTotal(items.map(item => {
      const product = products.find((p: Row) => p.id === item.productId);
      if (!product) throw new Error('Select a product for every item.');
      return { productId: product.id, name: product.data.name, description: product.data.description, warranty: product.data.warranty, hsn: product.data.hsn || '', unit: product.data.unit || 'Pcs', quantity: Number(item.quantity), unitPrice: product.amount, taxRate: product.data.taxRate ?? data.settings.taxRate };
    }), { installation: Number(installation), discount: Number(discount), taxRate: data.settings.taxRate });
  } catch (e) { validation = (e as Error).message; }
  return <div className="modal-backdrop quotation-builder-backdrop" onClick={() => !saving && onClose()}><section className="quotation-builder" role="dialog" aria-modal="true" aria-labelledby="quotation-builder-title" onClick={e => e.stopPropagation()}>
    <header className="quotation-builder-heading"><div><span className="eyebrow">CUSTOMER → ITEMS → QUOTATION</span><h2 id="quotation-builder-title">Create quotation</h2><p>Select a customer and catalogue items. Rates, GST and totals fill in automatically.</p></div><button className="icon-button" aria-label="Close quotation" disabled={saving} onClick={onClose}><X size={20}/></button></header>
    <form onSubmit={e => { e.preventDefault(); if (customer && totals) onSave({ customerId, ...(projectId ? { projectId } : {}), items: items.map(({ productId, quantity }) => ({ productId, quantity: Number(quantity) })), installation: Number(installation), discount: Number(discount), validUntil, taxMode, terms }); }}>
      <fieldset disabled={saving} className="quotation-fields"><div className="quotation-input-grid"><label className="form-field"><span>Customer name *</span><select autoFocus required value={customerId} disabled={!!projectId} onChange={e => setCustomerId(e.target.value)}><option value="">Select customer</option>{customers.map((l: Row) => <option key={l.id} value={l.id}>{l.name} · {l.mobile} · {l.data.city}</option>)}</select></label><label className="form-field"><span>Valid until *</span><input type="date" required min={new Date().toISOString().slice(0, 10)} value={validUntil} onChange={e => setValidUntil(e.target.value)}/></label></div>
      {!customers.length && <p className="alert">Add a customer in Leads & customers before creating a quotation.</p>}
      {customer?.data.qualificationRequired && <p className="alert">Confirm site details for this website enquiry in Leads &amp; customers before creating a quotation.</p>}
      {customer && <div className="quotation-customer-card"><b>{customer.name}</b><span>{customer.mobile} · {customer.customer_email}</span><span>{[customer.data.address, customer.data.city, customer.data.state, customer.data.pin].filter(Boolean).join(', ')}</span>{!data.projects.some((p: Row) => p.lead_id === customer.id) && <small>A linked project will be created when you save this quotation.</small>}</div>}
      <div className="quotation-section-heading"><h3>Items</h3><span>Rates are per catalogue unit, before GST.</span></div>
      {!products.length && <p className="alert">Add products in Products & kits first. Include their selling price, unit and GST rate.</p>}
      <div className="quotation-editor-scroll"><table className="quotation-editor-table"><thead><tr><th>Product / service *</th><th>Quantity *</th><th>Unit</th><th>Rate (₹)</th><th>GST</th><th>Amount (₹)</th><th/></tr></thead><tbody>{items.map((item, i) => {
        const product = products.find((p: Row) => p.id === item.productId);
        const line = totals?.items[i];
        return <tr key={item.key}><td><select aria-label={`Item ${i + 1}`} required value={item.productId} onChange={e => update(item.key, { productId: e.target.value })}><option value="">Select item</option>{products.map((p: Row) => <option key={p.id} value={p.id} disabled={items.some(other => other.key !== item.key && other.productId === p.id)}>{p.data.name} · ₹{quoteMoney(p.amount)}</option>)}</select>{product && <small>{product.data.brand}{product.data.hsn ? ` · HSN: ${product.data.hsn}` : ''}</small>}</td><td><input aria-label={`Quantity ${i + 1}`} type="number" min="0.001" max="10000" step="0.001" required value={item.quantity} onChange={e => update(item.key, { quantity: e.target.value })}/></td><td>{product?.data.unit || 'Pcs'}</td><td>{product ? quoteMoney(product.amount) : '—'}</td><td>{product ? `${product.data.taxRate ?? data.settings.taxRate}%` : '—'}</td><td>{line ? quoteMoney(line.total) : '—'}</td><td><button type="button" className="icon-button" disabled={items.length === 1} aria-label={`Remove item ${i + 1}`} onClick={() => setItems(items.filter(x => x.key !== item.key))}><Trash2 size={16}/></button></td></tr>;
      })}</tbody></table></div>
      <button type="button" className="button button-secondary" disabled={items.length >= 100 || !products.length} onClick={() => setItems([...items, { key: Math.max(...items.map(x => x.key)) + 1, productId: '', quantity: '1' }])}><Plus size={16}/> Add item</button>
      <div className="quotation-input-grid quotation-adjustments"><label className="form-field"><span>Installation charges (₹)</span><input type="number" min="0" step="0.01" required value={installation} onChange={e => setInstallation(e.target.value)}/></label><label className="form-field"><span>Discount before GST (₹)</span><input type="number" min="0" step="0.01" required value={discount} onChange={e => setDiscount(e.target.value)}/></label><label className="form-field"><span>GST presentation</span><select value={taxMode} onChange={e => setTaxMode(e.target.value)}><option value="CGST_SGST">CGST + SGST</option><option value="IGST">IGST</option></select></label></div>
      <label className="form-field"><span>Terms & conditions</span><textarea rows={4} maxLength={4000} value={terms} onChange={e => setTerms(e.target.value)}/></label>
      </fieldset>
      {validation && <p className="quotation-validation" role="status">{validation}</p>}{error && <div className="alert error" role="alert">{error}</div>}
      {totals && customer && <div className="quotation-live-preview"><div className="quotation-section-heading"><h3>Live preview</h3><span>Ready to save and print</span></div><QuotationDocument settings={data.settings} quote={{ status: 'Draft', data: { ...totals, installation: Number(installation), discount: Number(discount), customer: customer.name, customerDetails: { ...customer.data, name: customer.name, mobile: customer.mobile, email: customer.customer_email }, company: { name: data.settings.company, tagline: data.settings.tagline, address: data.settings.address, gstin: data.settings.gstin, state: data.settings.state, phone: data.settings.contactPhone, email: data.settings.contactEmail, bankDetails: data.settings.bankDetails }, validUntil, terms, taxMode } }}/></div>}
      <footer className="quotation-builder-footer"><div><small>Quotation total</small><strong>{totals ? `₹${quoteMoney(totals.total)}` : '—'}</strong></div><button type="button" className="button button-secondary" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="button button-glow" disabled={saving || !customer || !totals || customer.data.qualificationRequired}>{saving ? <LoaderCircle size={17} className="spin"/> : <FileText size={17}/>} {saving ? 'Saving…' : 'Save & view quotation'}</button></footer>
    </form>
  </section></div>;
}
