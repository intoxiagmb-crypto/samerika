import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {Building2, Factory, GraduationCap, House, Leaf, Sun, ClipboardCheck, FileText, PanelsTopLeft} from 'lucide-react';
import Brand from '@/components/brand';
import PublicHeader from '@/components/public-header';
import '../home.css';
import './projects.css';

export const metadata: Metadata = {
  title: 'Solar Projects | Samerika Power Private Limited',
  description: 'Explore solar project possibilities for homes, communities, businesses and industrial sites. Plan your project with Samerika Power or sign in to follow your installation.',
};

const categories = [
  {title: 'Residential rooftops', label: 'FOR YOUR HOME', icon: House, property: 'Residential', text: 'Turn available rooftop space into a place for clean energy, with a system planned around your household.', details: ['Rooftop space & shading assessment', 'Household electricity requirements', 'Equipment & installation planning'], tone: 'home', image: '/images/projects/residential.webp', alt: 'Illustrative family home with rooftop solar panels'},
  {title: 'Housing societies', label: 'FOR YOUR COMMUNITY', icon: Building2, property: 'Residential', text: 'Bring shared energy requirements and project coordination together for your residential community.', details: ['Common-area energy requirements', 'Shared rooftop planning', 'Coordinated project documentation'], tone: 'community', image: '/images/projects/society.webp', alt: 'Illustrative housing society with solar panels on apartment rooftops'},
  {title: 'Commercial spaces', label: 'FOR YOUR BUSINESS', icon: PanelsTopLeft, property: 'Commercial', text: 'Explore a solar plan that works with your premises, operating hours and day-to-day power needs.', details: ['Site & electricity-use review', 'A quotation with a clear scope', 'Installation milestone coordination'], tone: 'business', image: '/images/projects/commercial.webp', alt: 'Illustrative commercial office building with rooftop solar panels'},
  {title: 'Industrial facilities', label: 'FOR YOUR OPERATIONS', icon: Factory, property: 'Industrial', text: 'Start with your facility’s load requirements and available space to discuss a suitable solar proposal.', details: ['Facility-specific requirements', 'Proposed capacity & equipment', 'Project planning & handover'], tone: 'industry', image: '/images/projects/industrial.webp', alt: 'Illustrative factory with solar panels across its warehouse roof'},
  {title: 'Schools & institutions', label: 'FOR SHARED SPACES', icon: GraduationCap, property: 'Commercial', text: 'Plan for the energy needs of learning spaces and institutional buildings with a site-led approach.', details: ['Building & usage assessment', 'Installation scope discussion', 'Documentation & ongoing support'], tone: 'institution', image: '/images/projects/school.webp', alt: 'Illustrative school campus with rooftop solar panels and a playground'},
];

export default function ProjectsPage() {
  return <div className="samerika-home samerika-projects">
    <a className="sh-skip" href="#projects-content">Skip to content</a>
    <PublicHeader projects/>
    <main id="projects-content">
      <section className="sp-hero" aria-labelledby="projects-title">
        <Image src="/images/samerika-rooftop-hero.webp" alt="Illustrative solar canopy on a residential rooftop" fill sizes="100vw" preload/>
        <div className="sp-hero-shade"/>
        <div className="sp-hero-content"><nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span aria-current="page">Projects</span></nav><span className="sp-label">SOLAR PROJECTS</span><h1 id="projects-title">Every rooftop.<br/><em>A new possibility.</em></h1><p>From a family home to a working business, a solar project starts with understanding the space—and the people it powers.</p><div className="sp-actions"><a href="#project-types" className="sh-button sh-primary">Explore project types</a><Link href="/enquiry" className="sp-light-link">Discuss your project</Link></div></div>
        <span className="sp-image-note">Illustrative rooftop concept</span>
      </section>

      <section className="sp-section" id="project-types" aria-labelledby="types-title"><div className="sp-section-heading"><div><span className="sp-label">FIND YOUR STARTING POINT</span><h2 id="types-title">Solar for the spaces<br/><em>that matter to you.</em></h2></div><p>Explore the kinds of projects you can discuss with our team. The proposed system and scope are confirmed after reviewing your site.</p></div><p className="sp-gallery-note">Illustrative solar concepts for each project type.</p>
        <div className="sp-grid">{categories.map(({title,label,icon: Icon,property,text,details,tone,image,alt})=><article className={`sp-card sp-${tone}`} key={title}><div className="sp-card-image"><Image src={image} alt={alt} fill sizes="(max-width: 700px) 88vw, (max-width: 1050px) 44vw, 400px"/></div><div className="sp-card-body"><div className="sp-card-top"><span className="sp-icon"><Icon size={35} strokeWidth={1.5}/></span><span className="sp-label">{label}</span></div><h3>{title}</h3><p>{text}</p><ul>{details.map(detail=><li key={detail}><Leaf size={15}/>{detail}</li>)}</ul><Link href={`/enquiry?property=${property}`} className="sp-card-link">Plan a project like this</Link></div></article>)}
          <article className="sp-next"><Sun size={45} strokeWidth={1.3}/><span className="sp-label">YOUR SPACE COULD BE NEXT</span><h3>Have a different<br/>project in mind?</h3><p>Tell us about your location and electricity needs. We’ll help you find the right conversation to start.</p><Link href="/enquiry" className="sh-button sh-primary">Share your requirements</Link></article>
        </div>
      </section>

      <section className="sp-scope sp-section" aria-labelledby="scope-title"><div><span className="sp-label">A CLEAR PLAN FROM THE START</span><h2 id="scope-title">What goes into<br/><em>your solar project.</em></h2></div><div className="sp-scope-items">{[
        {icon:ClipboardCheck,title:'Site assessment',text:'Your space, shading, usage and installation requirements shape the proposed plan.'},
        {icon:FileText,title:'Detailed quotation',text:'Review equipment, quantities, services, applicable taxes and company terms before proceeding.'},
        {icon:PanelsTopLeft,title:'Installation & handover',text:'Coordinate documents and project milestones with your company team, through to handover.'},
      ].map(({icon: Icon,title,text})=><article key={title}><Icon size={26}/><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></section>

      <section className="sp-tracking sp-section" aria-labelledby="tracking-title"><div><span className="sp-label">ALREADY PLANNING WITH US?</span><h2 id="tracking-title">Your project.<br/><em>Your progress, connected.</em></h2><p>Sign in to your workspace to see the projects, documents and updates available to your account.</p></div><div className="sp-tracking-actions"><Link href="/portal?view=projects" className="sh-button sh-dark">Open my projects</Link><Link href="/portal?view=tracking" className="sh-button sh-outline">Track an application</Link><span>Company, staff and partners can use their assigned login.</span></div></section>

      <section className="sp-cta"><Sun size={35}/><h2>Let’s plan what’s next<br/>for your rooftop.</h2><p>Share your requirements. Our company team will follow up.</p><Link href="/enquiry" className="sh-button sh-primary">Start a project enquiry</Link></section>
    </main>
    <footer className="sp-footer"><Brand/><nav aria-label="Footer navigation"><Link href="/">Home</Link><Link href="/about">About Us</Link><Link href="/projects" aria-current="page">Projects</Link><Link href="/enquiry">Contact our team</Link></nav><small>© {new Date().getFullYear()} Samerika Power Private Limited</small></footer>
  </div>;
}
