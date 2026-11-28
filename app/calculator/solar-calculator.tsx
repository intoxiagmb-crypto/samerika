'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calculator, Check, Leaf, Sun, RotateCcw } from 'lucide-react';

type Estimate = { capacity: number; monthlyUnits: number; annualGeneration: number; roofLimited: boolean; bill: number; property: string };
export default function SolarCalculator() {
  const [property, setProperty] = useState('Residential');
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  function calculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const bill = Number(data.get('bill')), tariff = Number(data.get('tariff')), roof = Number(data.get('roof')), yieldPerDay = Number(data.get('yield'));
    if (![bill, tariff, roof, yieldPerDay].every(value => Number.isFinite(value) && value > 0)) return;
    const monthlyUnits = bill / tariff;
    // Planning assumptions are shown with the inputs, not an equipment or financial quote.
    const demandCapacity = monthlyUnits / (yieldPerDay * 30);
    const roofCapacity = roof / 110;
    const capacity = Math.round(Math.min(demandCapacity, roofCapacity) * 100) / 100;
    setEstimate({ capacity, monthlyUnits, annualGeneration: Math.round(capacity * yieldPerDay * 365), roofLimited: roofCapacity < demandCapacity, bill, property });
    requestAnimationFrame(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: 'start', behavior: 'auto' }); });
  }
  if (estimate) return <section className="app-calculator-result">
    <span className="app-success-icon"><Check size={34}/></span>
    <h2 ref={heading} tabIndex={-1}>Your solar starting point</h2><p>Indicative system size</p><strong className="app-result-value">{estimate.capacity.toLocaleString('en-IN', { maximumFractionDigits: 2 })} <span>kW</span></strong>
    <div className="app-result-grid"><article><span>Estimated usage</span><strong>{Math.round(estimate.monthlyUnits)} <small>units/month</small></strong></article><article><span>Potential generation</span><strong>{estimate.annualGeneration.toLocaleString('en-IN')} <small>units/year</small></strong></article></div>
    <div className="app-result-note"><Leaf size={25}/><p>{estimate.roofLimited ? 'Your available roof area limits this estimate. A site visit will help confirm a suitable layout.' : 'A brighter purpose for your rooftop. Let our team assess your site and finalise the right system.'}</p></div>
    <Link href={`/enquiry?property=${estimate.property}&monthlyBill=${estimate.bill}&interest=calculator`} scroll={false} className="app-button app-button-full">Request a site assessment</Link>
    <button type="button" className="app-button app-button-outline app-button-full" onClick={() => setEstimate(null)}><RotateCcw size={17}/> Recalculate</button>
    <p className="app-footnote">Planning estimate only. Shading, roof layout, location, sanctioned load and your actual electricity usage affect the final design. No savings or subsidy is guaranteed.</p>
  </section>;
  return <>
    <form className="app-calculator-form" onSubmit={calculate}>
      <fieldset className="app-segmented"><legend className="sr-only">Property type</legend>{['Residential', 'Commercial'].map(value => <label key={value}><input type="radio" name="property" value={value} checked={property === value} onChange={() => setProperty(value)}/><span>{value}</span></label>)}</fieldset>
      <label className="app-form-field"><span>Monthly electricity bill <small>₹</small></span><input name="bill" type="number" inputMode="decimal" min="100" max="1000000" step="1" defaultValue="2500" required/></label>
      <label className="app-form-field"><span>Your electricity rate <small>₹ / unit</small></span><input name="tariff" type="number" inputMode="decimal" min="1" max="50" step="0.1" defaultValue="8" required/><small>Use the energy rate from your electricity bill.</small></label>
      <label className="app-form-field"><span>Shade-free roof area <small>sq ft</small></span><input name="roof" type="number" inputMode="decimal" min="110" max="100000" step="1" defaultValue="400" required/></label>
      <details className="app-assumptions"><summary>Calculation assumptions</summary><label className="app-form-field"><span>Daily generation per kW <small>units</small></span><input name="yield" type="number" inputMode="decimal" min="1" max="6" step="0.1" defaultValue="4" required/></label><p>Assumes 30 days of use per month and a planning allowance of 110 sq ft per kW. Usage is estimated from bill ÷ unit rate; fixed charges and slab tariffs are not modelled.</p><p>Generation varies by site and season. <a href="https://www.tpnodl.com/Editor_UploadedDocuments/Content/FAQ_PM_Suryaghar_Muft_Bijli_Yojana__English.pdf" target="_blank" rel="noopener noreferrer">Read the utility’s solar generation guidance</a>.</p></details>
      <button className="app-button app-button-orange app-button-full" type="submit"><Calculator size={18}/> Calculate my solar plan</button>
    </form>
    <div className="app-calculator-photo"><Image src="/images/solar-rooftop-feature.webp" alt="Illustrative home with rooftop solar panels" fill sizes="(max-width:700px) 94vw, 560px"/><span><Sun size={18}/> A new purpose for your rooftop.</span></div>
  </>;
}
