'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { Check, CheckCircle2, LoaderCircle, ShieldCheck, AlertCircle } from 'lucide-react';
export default function EnquiryForm({ initialProperty = 'Residential', initialPin = '', initialRemarks = '' }: { initialProperty?: string; initialPin?: string; initialRemarks?: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [sent, setSent] = useState(false);
  const [property, setProperty] = useState(initialProperty);
  const submitting = useRef(false), successHeading = useRef<HTMLHeadingElement>(null), errorMessage = useRef<HTMLDivElement>(null);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true; setBusy(true); setError('');
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    try {
      const response = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...values, property }) });
      const result = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || 'Your enquiry could not be submitted. Please try again.');
      setSent(true);
      requestAnimationFrame(() => successHeading.current?.focus());
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Unable to connect. Please try again.');
      requestAnimationFrame(() => errorMessage.current?.focus());
    } finally { submitting.current = false; setBusy(false); }
  }
  if (sent) return <div className="enquiry-success" role="status"><span className="enquiry-success-icon"><CheckCircle2 size={36}/></span><span className="enquiry-overline">THANK YOU FOR REACHING OUT</span><h2 ref={successHeading} tabIndex={-1}>You’re on our list.</h2><p>Thank you for your interest in solar. Our team will review your enquiry and contact you using the details provided.</p><div className="enquiry-next"><Check size={18}/><span>Already enquired before? Your existing enquiry stays with the team.</span></div><Link className="enquiry-submit" href="/">Back to home</Link></div>;
  return <><div className="enquiry-form-heading"><span className="enquiry-overline">SOLAR ENQUIRY</span><h2>Let’s get started.</h2><p>Tell us how to reach you. We’ll take it from there.</p></div>
    <form onSubmit={submit} aria-busy={busy}>
      <fieldset disabled={busy} className="enquiry-fields">
        <fieldset className="enquiry-property"><legend>I’m looking for solar for my</legend><div>{[['Residential', 'Home'], ['Commercial', 'Business'], ['Industrial', 'Industry']].map(([value, label]) => <label key={value} className={property === value ? 'selected' : ''}><input type="radio" name="property" value={value} checked={property === value} onChange={() => setProperty(value)}/><span>{label}</span></label>)}</div></fieldset>
        <div className="enquiry-grid"><label>Full name <span>*</span><input name="name" autoComplete="name" required maxLength={120} placeholder="Your full name"/></label><label>Mobile number <span>*</span><input name="mobile" type="tel" inputMode="tel" autoComplete="tel-national" required pattern="(?:\+91[ -]?)?[6-9][0-9]{9}" maxLength={14} title="Enter a 10-digit Indian mobile number, optionally prefixed with +91." placeholder="10-digit mobile number"/></label><label className="enquiry-wide">Email address <span>*</span><input name="email" type="email" autoComplete="email" required maxLength={254} placeholder="you@example.com"/></label><label>City / town <span>*</span><input name="city" autoComplete="address-level2" required maxLength={100} placeholder="Your city"/></label><label>PIN code <span>*</span><input name="pin" defaultValue={initialPin} inputMode="numeric" autoComplete="postal-code" required pattern="[1-9][0-9]{5}" minLength={6} maxLength={6} title="Enter a 6-digit PIN code." placeholder="6-digit PIN code"/></label><label className="enquiry-wide">Anything we should know? <small>Optional</small><textarea name="remarks" defaultValue={initialRemarks} rows={2} maxLength={2000} placeholder="Your electricity bill, available roof space, or a question…"/></label></div>
        <div className="enquiry-honeypot" aria-hidden="true"><label>Leave this field empty<input name="website" tabIndex={-1} autoComplete="off"/></label></div>
        <p className="enquiry-consent">By submitting, you agree that our team may contact you about this solar enquiry.</p>
        {error && <div ref={errorMessage} tabIndex={-1} className="enquiry-error" role="alert"><AlertCircle size={18}/><span>{error}</span></div>}
        <button className="enquiry-submit" type="submit" disabled={busy}>{busy ? <><LoaderCircle size={19} className="spin"/> Submitting…</> : 'Send enquiry'}</button>
      </fieldset>
      <p className="enquiry-reassurance"><ShieldCheck size={15}/> Your details go directly to our solar team.</p>
    </form>
  </>;
}
