import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Sun } from 'lucide-react';

export default function SolarPlanner() {
  return <section className="sh-section sh-planner-section" id="solar-plan" aria-labelledby="planner-heading">
    <div className="sh-planner-shell">
      <div className="sh-planner-intro">
        <span className="sh-planner-mark"><Sun size={25}/></span>
        <span className="sh-eyebrow">A SMALL STEP. A BRIGHTER POSSIBILITY.</span>
        <h2 id="planner-heading">Your solar plan<br/>starts <em>with you.</em></h2>
        <p>A thoughtful solar setup starts with your rooftop, your energy needs and the right guidance.</p>
        <ol className="sh-planner-guidance">
          <li><span>01</span><div><strong>Your rooftop</strong><p>A site assessment helps identify the right layout.</p></div></li>
          <li><span>02</span><div><strong>Your energy needs</strong><p>Plan a system around your electricity use.</p></div></li>
          <li><span>03</span><div><strong>A conversation with our team</strong><p>Get a personalised quotation for your property.</p></div></li>
        </ol>
        <Link href="/enquiry" scroll={false} className="sh-button sh-primary sh-planner-quote">Get Free Solar Quote <ArrowRight size={18}/></Link>
        <div className="sh-planner-assurance"><ShieldCheck size={19}/><span>Your team confirms the proposed system<br/> after assessing your site.</span></div>
        <Sun className="sh-planner-decoration" size={230} strokeWidth={.6} aria-hidden="true"/>
      </div>

      <figure className="sh-planner-photo">
        <Image src="/images/solar-rooftop-feature.webp" alt="Illustration of a modern Indian home with blue solar panels on its rooftop in warm morning sunlight" fill sizes="(max-width: 700px) 88vw, 58vw"/>
        <figcaption><Sun size={17} aria-hidden="true"/> A new purpose for your rooftop. <span>Solar concept illustration</span></figcaption>
      </figure>
    </div>
  </section>;
}
