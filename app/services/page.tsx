import Image from 'next/image';
import Link from 'next/link';
import PublicHeader from '@/components/public-header';
import AppPageHeading from '@/components/app-page-heading';
import { ShieldCheck, Leaf } from 'lucide-react';
import '../home.css';

export const metadata = { title: 'Solar Services | Samerika Power' };
const services = [
  { title: 'Residential solar', detail: 'Clean energy for your everyday.', image: 'residential', property: 'Residential' },
  { title: 'Commercial solar', detail: 'A solar plan for your business.', image: 'commercial', property: 'Commercial' },
  { title: 'Industrial solar', detail: 'Built around your power needs.', image: 'industrial', property: 'Industrial' },
  { title: 'Community solar', detail: 'Shared spaces. A brighter future.', image: 'society', property: 'Residential' },
];
export default function ServicesPage() {
  return <div className="samerika-home app-public-page"><PublicHeader/><main className="app-page">
    <AppPageHeading title="Our services" description="Complete solar solutions, planned around you."/>
    <div className="app-services">{services.map(service => <Link href={`/enquiry?property=${service.property}`} scroll={false} key={service.title} className="app-service-card"><div className="app-service-photo"><Image src={`/images/projects/${service.image}.webp`} alt={`Illustrative ${service.title.toLowerCase()} installation`} fill sizes="100px"/></div><div><h2>{service.title}</h2><p>{service.detail}</p><span>Discuss your project</span></div></Link>)}</div>
    <div className="app-expert-card"><Image src="/images/solar-project-team.webp" alt="Illustrative solar installation team" fill sizes="(max-width:700px) 94vw, 560px"/><div><ShieldCheck size={26}/><h2>People for every<br/>part of your journey.</h2><Link href="/enquiry" scroll={false} className="app-button">Meet your solar team</Link></div></div>
    <p className="app-footnote"><Leaf size={16}/> Site assessment, clear quotations and connected project support. Images are illustrative.</p>
  </main></div>;
}
