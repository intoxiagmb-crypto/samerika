import Image from 'next/image';
import Link from 'next/link';
import { Calculator, CalendarDays, House, Building2, Leaf, ShieldCheck, PanelsTopLeft, Headphones } from 'lucide-react';

const actions = [
  { href: '/calculator', label: 'Solar calculator', icon: Calculator },
  { href: '/enquiry', label: 'Book consultation', icon: CalendarDays },
  { href: '/projects#project-home', label: 'Residential solar', icon: House },
  { href: '/projects#project-business', label: 'Commercial solar', icon: Building2 },
];

export default function MobileHome() {
  return <section className="mobile-home-panel" aria-label="Your solar home">
    <div className="mobile-solar-hero">
      <Image src="/images/samerika-rooftop-hero.webp" alt="Illustration of a solar-powered rooftop" fill sizes="(max-width: 700px) 94vw, 100vw"/>
      <div className="mobile-solar-hero-copy"><span>Powering a<br/>sustainable future</span><h1>Go Solar.<br/>Save More.</h1><Link href="/services" className="app-button app-button-orange">Explore solutions</Link></div>
      <span className="mobile-hero-note">Solar concept</span>
    </div>
    <div className="mobile-quick-actions">{actions.map(({ href, label, icon: Icon }) => <Link key={href} href={href} scroll={!href.startsWith('/enquiry')}><span><Icon size={24}/></span><strong>{label}</strong></Link>)}</div>
    <div className="mobile-section-heading"><h2>Solar possibilities</h2><Link href="/projects">View all</Link></div>
    <div className="mobile-project-previews">
      <Link href="/projects#project-home"><div><Image src="/images/projects/residential.webp" alt="Illustrative residential solar project" fill sizes="45vw"/></div><span>For your home</span><small>Residential solar</small></Link>
      <Link href="/projects#project-business"><div><Image src="/images/projects/commercial.webp" alt="Illustrative commercial solar project" fill sizes="45vw"/></div><span>For your business</span><small>Commercial solar</small></Link>
    </div>
    <p className="mobile-image-caption">Illustrative project concepts</p>
    <div className="mobile-section-heading"><h2>With you, at every step</h2><Link href="/about">About us</Link></div>
    <div className="mobile-service-list">
      <Link href="/enquiry" scroll={false}><span><PanelsTopLeft size={23}/></span><div><strong>A plan for your rooftop</strong><small>Site survey, design & quotation</small></div></Link>
      <Link href="/portal?view=tracking"><span><ShieldCheck size={23}/></span><div><strong>Follow your installation</strong><small>Your project. Your latest updates.</small></div></Link>
      <Link href="/contact"><span><Headphones size={23}/></span><div><strong>Your solar team, within reach</strong><small>Help before and after installation</small></div></Link>
    </div>
    <div className="mobile-green-card"><Leaf size={28}/><div><strong>A greener tomorrow<br/>starts on your roof.</strong><Link href="/enquiry" scroll={false}>Let’s plan it together</Link></div></div>
  </section>;
}
