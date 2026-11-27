'use client';
import { useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, AlertCircle, Info } from 'lucide-react';
import { BILL_RANGES, billRangeFor } from '@/lib/enquiry-options.mjs';

export type EnquiryDefaults = { initialProperty?: string; initialRemarks?: string; initialMonthlyBill?: number; initialPin?: string };
export default function EnquiryForm({ initialProperty = 'Residential', initialRemarks = '', initialMonthlyBill = 0, initialPin = '', consultation = false, onDone }: EnquiryDefaults & { consultation?: boolean; onDone?: () => void }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [sent, setSent] = useState(false);
  const [billRange, setBillRange] = useState(billRangeFor(initialMonthlyBill));
  const submitting = useRef(false), successHeading = useRef<HTMLHeadingElement>(null), errorMessage = useRef<HTMLDivElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, property: initialProperty, pin: String(values.pin || ''), monthlyBillRange: billRange, monthlyBill: billRange === billRangeFor(initialMonthlyBill) ? initialMonthlyBill : 0, contactConsent: values.contactConsent === 'on', remarks: initialRemarks }) });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || 'Your enquiry could not be submitted. Please try again.');
      setSent(true);
      requestAnimationFrame(() => successHeading.current?.focus());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to connect. Please try again.');
      requestAnimationFrame(() => errorMessage.current?.focus());
    } finally { submitting.current = false; setBusy(false); }
  }
  if (sent) return <div className="quote-enquiry-success" role="status"><CheckCircle2 size={48}/><h2 ref={successHeading} tabIndex={-1}>Thank you!</h2><p>Your enquiry is with our solar team. We’ll contact you using the number you provided.</p><button type="button" className="quote-enquiry-submit" onClick={onDone}>Done</button></div>;
  return <form onSubmit={submit} aria-busy={busy} className="quote-enquiry-form">
    <fieldset disabled={busy} className="quote-enquiry-fields">
      {initialRemarks && <p className="quote-enquiry-interest">{initialRemarks}</p>}
      <label className="quote-enquiry-input"><span className="quote-enquiry-sr">Full name</span><input name="name" autoComplete="name" required maxLength={120} placeholder="Full Name"/></label>
      <label className="quote-enquiry-input"><span className="quote-enquiry-sr">WhatsApp number</span><input name="mobile" type="tel" inputMode="tel" autoComplete="tel-national" required pattern="(?:\+91[ -]?)?[6-9][0-9]{9}" maxLength={14} title="Enter a 10-digit Indian mobile number, optionally prefixed with +91." placeholder="WhatsApp Number"/></label>
      {consultation ? <label className="quote-enquiry-input"><span className="quote-enquiry-sr">Monthly Electricity Bill</span><select name="monthlyBillRange" required value={billRange} onChange={event => setBillRange(event.target.value)}><option value="" disabled>Monthly Electricity Bill *</option>{BILL_RANGES.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}</select></label> : <fieldset className="quote-enquiry-bills"><legend>Monthly Electricity Bill <Info size={16} aria-hidden="true"/></legend><div>{BILL_RANGES.map(range => <label key={range.value}><input type="radio" name="monthlyBillRange" required value={range.value} checked={billRange === range.value} onChange={() => setBillRange(range.value)}/><span>{range.label}</span></label>)}</div></fieldset>}
      {initialMonthlyBill > 0 && billRange === billRangeFor(initialMonthlyBill) && <p className="quote-enquiry-estimate">Your estimate: ₹{initialMonthlyBill.toLocaleString('en-IN')} per month</p>}
      <div className={consultation ? 'quote-enquiry-location' : undefined}><label className="quote-enquiry-input"><span className="quote-enquiry-sr">Village / City name</span><input name="city" autoComplete="address-level2" required maxLength={100} placeholder="Village / City Name"/></label>{consultation && <label className="quote-enquiry-input"><span className="quote-enquiry-sr">PIN Code (optional)</span><input name="pin" defaultValue={initialPin} inputMode="numeric" autoComplete="postal-code" pattern="[1-9][0-9]{5}" maxLength={6} title="Enter a 6-digit PIN code." placeholder="PIN Code (optional)"/></label>}</div>
      <input type="hidden" name="property" value={initialProperty}/>{!consultation && <input type="hidden" name="pin" value={initialPin}/>}
      <div className="quote-enquiry-honeypot" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
      <label className="quote-enquiry-consent"><input type="checkbox" name="contactConsent" required/><span>I agree that Samerika Power may contact me about my solar enquiry.</span></label>
      {error && <div ref={errorMessage} tabIndex={-1} className="quote-enquiry-error" role="alert"><AlertCircle size={18}/><span>{error}</span></div>}
      <button className="quote-enquiry-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle size={19} className="spin"/> Submitting…</> : consultation ? 'Book a FREE Consultation' : 'Submit Details'}</button>
    </fieldset>
  </form>;
}
