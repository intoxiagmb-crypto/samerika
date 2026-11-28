import Brand from '@/components/brand';
import { portalDestination } from '@/lib/portal-destination';
import { Users, Building2, BriefcaseBusiness, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

const portals = [
  { href: '/login/company', title: 'Company login', label: 'FOR OWNERS & ADMINISTRATORS', icon: Building2, description: 'Manage your company, create staff accounts, assign leads and oversee projects and payments.' },
  { href: '/login/staff', title: 'Company staff login', label: 'FOR YOUR COMPANY TEAM', icon: BriefcaseBusiness, description: 'Follow up on enquiries, prepare quotations and manage the work assigned to your staff role.' },
  { href: '/login/partner', title: 'Partner login', label: 'FOR CHANNEL PARTNERS', icon: Users, description: 'Submit customer requirements, follow your installations and track your approved earnings.' },
];

export default async function LoginChooser({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const next=portalDestination((await searchParams).next);
  return <main className="portal-choice three-portals">
    <Brand/>
    <div className="choice-heading"><span className="eyebrow">WELCOME TO YOUR SOLAR WORKSPACE</span><h1>One team.<br/>Your own workspace.</h1><p>Choose the login that matches your account.</p></div>
    <div className="choice-grid">{portals.map(({ href, title, label, icon: Icon, description }) => <a key={href} href={next==='/portal'?href:`${href}?next=${encodeURIComponent(next)}`} className="choice-card">
      <span className="entry-icon"><Icon size={28}/></span><span className="eyebrow">{label}</span><h2>{title}</h2><p>{description}</p><span className="choice-action">Sign in <ArrowRight size={18}/></span>
    </a>)}</div>
    <p className="choice-note"><ShieldCheck size={16}/> Use the account provided by your company administrator.</p>
    <a href="/" className="text-link"><ArrowLeft size={15}/> Back to website</a>
  </main>;
}
