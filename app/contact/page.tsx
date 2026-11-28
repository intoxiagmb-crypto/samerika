import Image from 'next/image';
import Link from 'next/link';
import { CalendarDays, Headphones, ClipboardList, MessageCircle } from 'lucide-react';
import PublicHeader from '@/components/public-header';
import AppPageHeading from '@/components/app-page-heading';
import '../home.css';

export const metadata = { title: 'Contact & Support | Samerika Power' };
export default function ContactPage() {
  return <div className="samerika-home app-public-page"><PublicHeader/><main className="app-page">
    <AppPageHeading title="Contact us" description="A question today. A clearer next step tomorrow."/>
    <div className="app-contact-hero"><Image src="/images/samerika-rooftop-hero.webp" alt="Illustration of a rooftop solar canopy" fill sizes="(max-width:700px) 94vw, 560px"/><div><MessageCircle size={32}/><h2>Let’s talk solar.</h2><p>Your team is here to help.</p></div></div>
    <div className="app-contact-options">
      <Link href="/enquiry?interest=callback" scroll={false}><span><CalendarDays size={24}/></span><div><h2>Request a callback</h2><p>Share your number and rooftop plans. Our team will follow up.</p></div></Link>
      <Link href="/portal?view=support"><span><Headphones size={24}/></span><div><h2>Project support</h2><p>Sign in to raise a ticket and read replies from your team.</p></div></Link>
      <Link href="/portal?view=tracking"><span><ClipboardList size={24}/></span><div><h2>Installation updates</h2><p>See the latest milestones recorded for your project.</p></div></Link>
    </div>
    <Link className="app-button app-button-orange app-button-full" href="/enquiry" scroll={false}>Send an enquiry</Link>
    <p className="app-footnote">Samerika Power Private Limited · Solar for your space.</p>
  </main></div>;
}
