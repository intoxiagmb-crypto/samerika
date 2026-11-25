import Brand from '@/components/brand';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Sun, House, MessageCircle, Check } from 'lucide-react';
import EnquiryForm from './enquiry-form';
import './enquiry.css';
export const metadata: Metadata = { title: 'Enquire about solar | Samerika Power Private Limited', description: 'Tell us a little about your home or business. Our team will help you plan your solar installation.' };
export default async function EnquiryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const property = typeof params.property === 'string' && ['Residential', 'Commercial', 'Industrial'].includes(params.property) ? params.property : 'Residential';
  const pin = typeof params.pin === 'string' && /^[1-9]\d{5}$/.test(params.pin) ? params.pin : '';
  const bill = typeof params.monthlyBill === 'string' && /^\d{1,9}$/.test(params.monthlyBill) ? Number(params.monthlyBill) : 0;
  const remarks = bill > 0 && bill <= 100000000 ? `Average monthly electricity bill: ₹${bill.toLocaleString('en-IN')} (customer estimate).` : '';
  return <main className="enquiry-page">
    <header className="enquiry-nav"><Brand/><Link href="/" className="enquiry-home">Back to home</Link></header>
    <section className="enquiry-card" aria-labelledby="enquiry-title">
      <aside className="enquiry-intro"><span className="enquiry-overline">LET’S TALK SOLAR</span><h1 id="enquiry-title">Your rooftop.<br/><em>A brighter future.</em></h1><p>A few details are all we need to start your solar journey.</p>
        <div className="enquiry-roof" aria-hidden="true"><Sun className="enquiry-sun"/><House/><span className="roof-panel"><i/><i/><i/><i/><i/><i/></span></div>
        <div className="enquiry-promise"><MessageCircle size={21}/><div><strong>A conversation, first.</strong><span>Our team will contact you to understand your needs and explain the next steps.</span></div></div>
        <ul><li><Check size={16}/> No account needed</li><li><Check size={16}/> For homes & businesses</li></ul>
      </aside>
      <div className="enquiry-form-panel"><EnquiryForm initialProperty={property} initialPin={pin} initialRemarks={remarks}/></div>
    </section>
    <footer className="enquiry-page-footer">Samerika Power Private Limited · Better energy, connected.</footer>
  </main>;
}
