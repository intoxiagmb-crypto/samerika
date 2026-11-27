'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Building2, Check, House, MapPin, PanelsTopLeft, ShieldCheck, Sun } from 'lucide-react';

const properties = [
  { value: 'Residential', label: 'Home', detail: 'Home or society', Icon: House },
  { value: 'Commercial', label: 'Business', detail: 'Commercial space', Icon: Building2 },
  { value: 'Industrial', label: 'Industry', detail: 'Industrial site', Icon: PanelsTopLeft },
];
const amounts = [1500, 3000, 5000, 10000];

export default function SolarPlanner() {
  const [bill, setBill] = useState('');
  const router = useRouter();
  return <section className="sh-section sh-planner-section" id="solar-plan" aria-labelledby="planner-heading">
    <div className="sh-planner-shell">
      <div className="sh-planner-intro">
        <span className="sh-planner-mark"><Sun size={25}/></span>
        <span className="sh-eyebrow">A SMALL STEP. A BRIGHTER POSSIBILITY.</span>
        <h2 id="planner-heading">Your solar plan<br/>starts <em>with you.</em></h2>
        <p>Tell us about your space and electricity use. We’ll keep these details ready for your enquiry.</p>
        <ol className="sh-planner-guidance">
          <li><span>01</span><div><strong>Your rooftop</strong><p>Choose your property and site location.</p></div></li>
          <li><span>02</span><div><strong>Your energy needs</strong><p>Share your usual monthly electricity bill.</p></div></li>
          <li><span>03</span><div><strong>A conversation with our team</strong><p>Add contact details on the next page.</p></div></li>
        </ol>
        <div className="sh-planner-assurance"><ShieldCheck size={19}/><span>Your team confirms the proposed system<br/> after assessing your site.</span></div>
        <Sun className="sh-planner-decoration" size={230} strokeWidth={.6} aria-hidden="true"/>
      </div>

      <form action="/enquiry" method="get" onSubmit={event => { event.preventDefault(); const params = new URLSearchParams(); new FormData(event.currentTarget).forEach((value, key) => params.set(key, String(value))); router.push(`/enquiry?${params}`, { scroll: false }); }} className="sh-planner-fields" aria-label="Start a solar enquiry">
        <div className="sh-planner-progress" aria-label="Step 1 of 2: rooftop details"><span className="current"><b>1</b> Rooftop details</span><i aria-hidden="true"/><span><b>2</b> Contact details</span></div>
        <div className="sh-planner-form-heading"><span className="sh-eyebrow">LET’S GET STARTED</span><h3>A little about your rooftop.</h3><p>A few details now. A more useful conversation next.</p></div>
        <fieldset className="sh-property-picker"><legend>I’m exploring solar for</legend><div>{properties.map(({value,label,detail,Icon},index)=><label key={value}>
          <input type="radio" name="property" value={value} defaultChecked={index===0} required/>
          <span className="sh-property-tile"><span className="sh-property-icon"><Icon size={22} strokeWidth={1.7}/></span><span className="sh-property-check" aria-hidden="true"><Check size={10}/></span><strong>{label}</strong><small>{detail}</small></span>
        </label>)}</div></fieldset>
        <div className="sh-planner-input-grid">
          <div className="sh-planner-field"><label htmlFor="plan-pin">Site PIN code <span>*</span></label><div className="sh-planner-input"><MapPin size={18} aria-hidden="true"/><input id="plan-pin" name="pin" inputMode="numeric" pattern="[1-9][0-9]{5}" maxLength={6} minLength={6} placeholder="e.g. 302001" required title="Enter a valid 6-digit PIN code" autoComplete="postal-code" aria-describedby="plan-pin-help"/></div><small id="plan-pin-help">Where will the system be installed?</small></div>
          <div className="sh-planner-field"><label htmlFor="plan-bill">Monthly electricity bill <span>*</span></label><div className="sh-planner-input"><span className="sh-rupee" aria-hidden="true">₹</span><input id="plan-bill" name="monthlyBill" type="number" inputMode="numeric" min={1} max={100000000} step={1} placeholder="e.g. 3,000" required value={bill} onChange={event=>setBill(event.target.value)} aria-describedby="plan-bill-help"/></div><small id="plan-bill-help">An approximate monthly amount is fine.</small></div>
        </div>
        <div className="sh-bill-presets" role="group" aria-label="Quick monthly electricity bill amounts"><span>Quick select</span><div>{amounts.map(amount=><button key={amount} type="button" aria-pressed={Number(bill)===amount} onClick={()=>setBill(String(amount))}>₹{amount.toLocaleString('en-IN')}</button>)}</div></div>
        <div className="sh-planner-form-footer"><button className="sh-button sh-primary" type="submit">Continue to my enquiry <ArrowRight size={18}/></button><p><ShieldCheck size={14}/> No account needed. Your contact details come next.</p></div>
      </form>
    </div>
  </section>;
}
