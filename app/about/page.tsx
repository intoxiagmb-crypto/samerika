import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {Building2, ClipboardCheck, FileText, Headphones, House, Leaf, PanelsTopLeft, Sun, Users} from 'lucide-react';
import Brand from '@/components/brand';
import PublicHeader from '@/components/public-header';
import '../home.css';
import './about.css';

export const metadata: Metadata = {
  title: 'About Us | Samerika Power Private Limited',
  description: 'Meet Samerika Power. Solar planning for homes, communities and businesses, with clear quotations and a connected journey from enquiry to handover.',
};

const services = [
  {icon: House, title: 'Solar for homes', text: 'A rooftop solution planned around your household’s electricity use, available space and site conditions.', property: 'Residential'},
  {icon: Building2, title: 'Solar for communities', text: 'Coordinated planning for housing societies and shared spaces, with a clear scope for everyone involved.', property: 'Residential'},
  {icon: PanelsTopLeft, title: 'Solar for business', text: 'Site-specific solar planning for commercial and industrial premises, shaped around the way your business operates.', property: 'Commercial'},
];
const steps = [
  {icon: Users, title: 'Understand your requirements', text: 'We begin with your location, electricity needs and questions, then assess the site to understand what is possible.'},
  {icon: FileText, title: 'Put the plan in writing', text: 'Review the proposed equipment, quantities, services, pricing and terms in an itemised quotation.'},
  {icon: ClipboardCheck, title: 'Coordinate the next steps', text: 'Your company team brings together the required documentation, approval steps and installation milestones.'},
  {icon: Headphones, title: 'Stay connected after installation', text: 'Keep your handover details together, follow recorded progress and reach the team when you need support.'},
];

export default function AboutPage() {
  return <div className="samerika-home samerika-about">
    <a className="sh-skip" href="#about-content">Skip to content</a>
    <PublicHeader about/>
    <main id="about-content">
      <section className="sa-hero" aria-labelledby="about-title">
        <div className="sa-hero-copy"><nav className="sa-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">About Us</span></nav>
          <span className="sa-label">ABOUT SAMERIKA POWER</span><h1 id="about-title">Good energy.<br/>Built around <em>you.</em></h1>
          <p>We bring people, planning and solar power together—so the journey from your first question to your rooftop installation feels clearer.</p>
          <Link href="/enquiry" className="sh-button sh-primary">Talk to our solar team</Link>
          <div className="sa-hero-note"><Sun size={23}/><span>Samerika Power Private Limited<br/><strong>Your space. Your needs. Your solar journey.</strong></span></div>
        </div>
        <figure className="sa-hero-image"><Image src="/images/samerika-rooftop-hero.webp" alt="Illustrative home terrace with a rooftop solar canopy" fill sizes="(max-width: 800px) 100vw, 50vw" preload/><figcaption><Leaf size={19}/> A new purpose for your rooftop.</figcaption></figure>
      </section>

      <section className="sa-section sa-introduction" aria-labelledby="who-title"><div><span className="sa-label">WHO WE ARE</span><h2 id="who-title">Solar for your space.<br/><em>People for every step.</em></h2></div><div className="sa-prose"><p>Samerika Power Private Limited helps homeowners, communities and businesses plan their move to solar. We start with the property and the people using it, bringing site requirements, system planning and project coordination into one journey.</p><p>Choosing solar involves more than choosing panels. It means understanding your proposed system, knowing what your quotation covers and staying informed as the work progresses. Our approach keeps those details connected, with a company team you can follow up with.</p></div></section>

      <section className="sa-purpose sa-section" aria-label="Our mission and vision"><article><span className="sa-purpose-icon"><Sun size={28}/></span><span className="sa-label">OUR MISSION</span><h2>Make the next step<br/>towards solar clearer.</h2><p>Help people make informed solar decisions through thoughtful site planning, clear proposals and coordinated support throughout their project.</p></article><article><span className="sa-purpose-icon"><Leaf size={28}/></span><span className="sa-label">OUR VISION</span><h2>More rooftops.<br/>More possibilities.</h2><p>A future where homes, communities and businesses can make better use of their space to generate clean energy and take a more active role in how they power their day.</p></article></section>

      <section className="sa-section" aria-labelledby="services-title"><div className="sa-section-heading"><span className="sa-label">WHAT WE DO</span><h2 id="services-title">Different spaces.<br/><em>The same thoughtful approach.</em></h2><p>Every property has its own requirements. Your proposed system starts with understanding yours.</p></div><div className="sa-services">{services.map(({icon: Icon, title, text, property})=><article key={title}><Icon size={31} strokeWidth={1.6}/><h3>{title}</h3><p>{text}</p><Link href={`/enquiry?property=${property}`}>Discuss your requirements</Link></article>)}</div></section>

      <section className="sa-process sa-section" aria-labelledby="approach-title"><div className="sa-process-intro"><span className="sa-label">HOW WE WORK</span><h2 id="approach-title">From first hello<br/><em>to a connected handover.</em></h2><p>A clear plan, shared expectations and people who know the next step.</p><Link href="/enquiry" className="sh-button sh-primary">Start your solar enquiry</Link></div><div className="sa-steps">{steps.map(({icon: Icon, title, text})=><article key={title}><span><Icon size={24}/></span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>

      <section className="sa-section sa-values" aria-labelledby="values-title"><span className="sa-label">WHAT MATTERS TO US</span><h2 id="values-title">Clarity. Care. Connection.</h2><div><article><h3>Clarity in the details</h3><p>Equipment, pricing and scope should be easy to review before you decide to proceed.</p></article><article><h3>Care for your requirements</h3><p>Your electricity use and site conditions guide the conversation about the right system for your space.</p></article><article><h3>Connection throughout</h3><p>Customers, company staff and channel partners stay connected through project records, updates and support.</p></article></div></section>

      <section className="sa-invite" aria-labelledby="invite-title"><Sun size={42} strokeWidth={1.4}/><span className="sa-label">LET’S GET TO KNOW YOUR ROOFTOP</span><h2 id="invite-title">Your next chapter<br/>can start with the sun.</h2><p>Tell us about your space. Our team will help you understand the next step.</p><Link href="/enquiry" className="sh-button sh-primary">Enquire about solar</Link><span className="sa-invite-note">No account needed to send an enquiry.</span></section>
    </main>
    <footer className="sa-footer"><div><Brand/><p>Samerika Power Private Limited<br/>Better energy, connected.</p></div><nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/about" aria-current="page">About Us</Link><Link href="/enquiry">Contact our team</Link><Link href="/login">Portal login</Link></nav><small>© {new Date().getFullYear()} Samerika Power Private Limited</small></footer>
  </div>;
}
