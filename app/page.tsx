import HomeFaqs from '@/components/home-faqs';
import HomeEnquiryPopup from '@/components/home-enquiry-popup';
import HomeBannerCarousel from '@/components/home-banner-carousel';
import PublicHeader from '@/components/public-header';
import MobileHome from '@/components/mobile-home';
import Image from 'next/image';
import Link from 'next/link';
import SolarPlanner from '@/components/solar-planner';
import SolarHomesCounter from '@/components/solar-homes-counter';
import { ArrowRight, ArrowUpRight, Building2, Check, ClipboardCheck, FileText, House, Leaf, MessageCircle, PanelsTopLeft, ShieldCheck, Sun, Users, Headphones } from 'lucide-react';
import './home.css';
import './home-subsidy.css';
import './home-highlights.css';
import './home-projects.css';
import './home-products.css';
import './home-banners.css';

const offerings = [
  { title: 'Homes', icon: House, property: 'Residential', description: 'Make room for clean energy on the roof you already have.', note: 'For your everyday energy', className: 'home', category: 'Residential', features: ['Rooftop assessment', 'Personalised quotation'], cta: 'Explore home solar' },
  { title: 'Housing societies', icon: Building2, property: 'Residential', description: 'Explore a rooftop system for your community’s shared energy needs.', note: 'For a connected community', className: 'society', category: 'Community', features: ['Shared energy needs', 'Coordinated planning'], cta: 'Plan for your society' },
  { title: 'Businesses & industry', icon: PanelsTopLeft, property: 'Commercial', description: 'Plan a solar installation around your premises and power requirements.', note: 'For the way you work', className: 'business', category: 'Commercial', features: ['Site-specific planning', 'Project coordination'], cta: 'Discuss your business needs' },
];
const benefits = [
  { icon: ClipboardCheck, title: 'Planned for your rooftop', text: 'A site survey helps the team understand your space, usage and installation requirements.' },
  { icon: FileText, title: 'Clarity before you commit', text: 'Review your equipment, quantities and pricing together in a detailed quotation.' },
  { icon: ShieldCheck, title: 'A coordinated journey', text: 'Your company team keeps documents, approvals and installation milestones connected.' },
  { icon: Headphones, title: 'Your team, within reach', text: 'Follow up with the team and raise a support request from your workspace.' },
];
const journey = [
  { title: 'Let’s talk about your roof', text: 'Share your location and electricity needs. Our staff will help you get started.', icon: MessageCircle, label: 'Start the conversation', detail: 'Your space. Your requirements.' },
  { title: 'A plan made for your site', text: 'Review the site assessment, proposed system and itemised quotation with your team.', icon: FileText, label: 'Survey, design & quote', detail: 'Know what goes into your system.' },
  { title: 'Bring your project to life', text: 'Work with the team on the required documents, approvals and installation.', icon: PanelsTopLeft, label: 'Approvals & installation', detail: 'Keep the next step in sight.' },
  { title: 'Stay connected, beyond setup', text: 'Keep handover documents together, follow recorded milestones and reach out for support.', icon: Headphones, label: 'Handover & support', detail: 'Your team stays within reach.' },
];
const faqs = [
  ['How do I get started with Samerika Power?', 'Send an enquiry with your name, mobile number and city. Our company staff will contact you to understand your requirements and discuss the next steps. You do not need an account to enquire.'],
  ['Which solar system is right for my property?', 'The right system depends on your electricity use, available rooftop space and site conditions. Share your requirement first; the team confirms the design and capacity after assessing your site.'],
  ['What will my solar quotation include?', 'Your quotation can include the selected panels, inverter, accessories and services, along with quantities, applicable taxes, pricing and terms. Review the proposed scope with the team before proceeding.'],
  ['Can I track my application and installation?', 'Yes. Your project workspace shows the milestones recorded by the company team. Application stages and installation progress are tracked separately, with status dates and references where available. Government application updates are recorded manually.'],
  ['Will a subsidy apply to my project?', 'Ask the company team to check the requirements that apply to your property and application. Eligibility, approval and disbursal must be confirmed through the relevant process; submitting an enquiry does not guarantee a subsidy.'],
  ['Which login should I choose?', 'Company owners and administrators use Company login. Employees use Company Staff login. Channel partners use Partner login to follow their own referrals, projects and approved earnings.'],
];

export default function HomePage() {
  return <main className="samerika-home samerika-homepage" id="home-content">
    <a className="sh-skip" href="#home-content">Skip to content</a>
    <PublicHeader/><HomeEnquiryPopup/>
    <MobileHome/>

    <HomeBannerCarousel/>

    <section className="sh-highlights" id="solar-highlights" aria-labelledby="highlights-heading">
      <h2 id="highlights-heading">Powering more homes <span>with solar.</span></h2>
      <div className="sh-highlights-grid">
        <SolarHomesCounter/>
        <article className="sh-highlight-card"><Sun size={32} strokeWidth={1.8} aria-hidden="true"/><h3>Rooftop solar</h3><p>For homes & businesses</p></article>
        <article className="sh-highlight-card"><FileText size={32} strokeWidth={1.8} aria-hidden="true"/><h3>Subsidy guidance</h3><p>PM Surya Ghar support</p></article>
        <article className="sh-highlight-card"><Headphones size={32} strokeWidth={1.8} aria-hidden="true"/><h3>Connected support</h3><p>From enquiry to handover</p></article>
      </div>
      <div className="sh-highlights-cta"><div><Leaf size={31} strokeWidth={1.7} aria-hidden="true"/><p>Your rooftop could be next.<br/><strong>Let’s plan your move to solar.</strong></p></div><Link href="/enquiry" scroll={false} className="sh-button sh-dark">Unlock your solar savings</Link></div>
    </section>

    <section className="sh-subsidy" id="solar-subsidy" aria-labelledby="subsidy-heading">
      <div className="sh-subsidy-card">
        <div className="sh-subsidy-copy">
          <span className="sh-subsidy-label"><Sun size={20} aria-hidden="true"/> GOVERNMENT SOLAR PROGRAM</span>
          <h2 id="subsidy-heading">PM Surya Ghar <span>Muft Bijli Yojana</span></h2>
          <p>Turn your rooftop into solar savings with subsidy support for eligible homes in Uttar Pradesh.</p>
          <div className="sh-subsidy-actions"><Link href="/enquiry?property=Residential&program=pm-surya-ghar" scroll={false} className="sh-button sh-primary">Apply for Solar Subsidy <ArrowRight size={18}/></Link><Link href="/programs">View subsidy details</Link></div>
        </div>
        <div className="sh-subsidy-amount">
          <span>COMBINED SUBSIDY IN UTTAR PRADESH</span>
          <strong><small>Up to</small> ₹1,08,000</strong>
          <p>Central up to ₹78,000 <span aria-hidden="true">+</span> UP up to ₹30,000</p>
          <div className="sh-subsidy-condition"><ShieldCheck size={17} aria-hidden="true"/><span>For eligible residential installations of 3 kW or more. Subject to scheme rules and government approval.</span></div>
        </div>
      </div>
    </section>

    <section className="sh-section sh-solutions" id="solutions" aria-labelledby="solutions-heading">
      <div className="sh-solutions-heading"><div><span className="sh-eyebrow">A SOLAR SOLUTION FOR YOUR SPACE</span><h2 id="solutions-heading">Bring solar to <em>your world.</em></h2></div><p>Choose your space. We’ll help you take<br className="sh-solutions-break"/> the next step towards solar.</p></div>
      <div className="sh-solutions-grid">{offerings.map(({ title, icon: Icon, property, description, note, className, category, features, cta }) => <Link href={`/enquiry?property=${property}`} scroll={false} className={`sh-solution-card ${className}`} key={title} aria-label={`${cta} — send an enquiry`}>
        <div className="sh-solution-top"><span className="sh-solution-icon"><Icon size={34} strokeWidth={1.65}/></span><span className="sh-solution-category">{category}</span><Sun className="sh-solution-sun" size={110} strokeWidth={.8} aria-hidden="true"/></div>
        <div className="sh-solution-body"><span className="sh-solution-note">{note}</span><h3>{title}</h3><p>{description}</p><ul>{features.map(feature=><li key={feature}><Check size={14}/>{feature}</li>)}</ul><div className="sh-solution-cta"><span>{cta}</span><span className="sh-solution-arrow"><ArrowUpRight size={19}/></span></div></div>
      </Link>)}</div>
      <p className="sh-solutions-help"><MessageCircle size={16}/> Not sure where to start? <Link href="/enquiry" scroll={false}>Talk to our solar team <ArrowRight size={14}/></Link></p>
    </section>

    <section className="sh-section sh-products" id="solar-products" aria-labelledby="products-heading">
      <div className="sh-products-heading"><div><span className="sh-eyebrow">SOLAR PRODUCTS & SYSTEMS</span><h2 id="products-heading">The right equipment.<br/><em>For your solar plan.</em></h2></div><div><p>Explore equipment for your rooftop. Ask our team about available models, pricing and compatibility.</p><Link href="/enquiry?interest=products" scroll={false} className="sh-button sh-primary">Get Price &amp; Details <ArrowRight size={18}/></Link></div></div>
      <div className="sh-products-grid">{[
        {id:'panels',title:'Solar panels',Icon:PanelsTopLeft,tag:'GENERATE',text:'Discuss panel capacity, available models and the right fit for your rooftop.'},
        {id:'inverters',title:'Solar inverters',Icon:Sun,tag:'CONVERT',text:'Find an inverter suited to your proposed system and electricity requirements.'},
        {id:'solar-kits',title:'Solar kits & systems',Icon:House,tag:'CONNECT',text:'Plan a complete solar setup with equipment selected for your site.'},
      ].map(({id,title,Icon,tag,text})=><article className="sh-product-card" key={id}><div className="sh-product-visual"><Icon size={68} strokeWidth={1.2} aria-hidden="true"/><span>{tag}</span></div><div className="sh-product-copy"><h3>{title}</h3><p>{text}</p><Link href={`/enquiry?interest=${id}`} scroll={false} aria-label={`Enquire Now about ${title}`}>Enquire Now <ArrowUpRight size={19}/></Link></div></article>)}</div>
    </section>

    <section className="sh-project-gallery" id="featured-projects" aria-labelledby="gallery-heading">
      <div className="sh-project-gallery-heading"><div><span className="sh-eyebrow">EXPLORE OUR PROJECTS</span><h2 id="gallery-heading">Different spaces.<br/><em>Powered by solar.</em></h2></div><Link href="/projects" className="sh-button sh-primary">View all projects</Link></div>
      <div className="sh-project-gallery-grid">
        {[
          {title:'Residential rooftops',label:'FOR YOUR HOME',image:'residential',anchor:'home',alt:'Illustrative family home with rooftop solar panels'},
          {title:'Commercial spaces',label:'FOR YOUR BUSINESS',image:'commercial',anchor:'business',alt:'Illustrative office building with rooftop solar panels'},
          {title:'Atta Chakki / Flour Mill',label:'FOR YOUR FLOUR MILL',image:'flour-mill',anchor:'mill',alt:'Illustrative atta chakki with solar panels on its roof'},
        ].map(project => <Link href={`/projects#project-${project.anchor}`} className="sh-project-gallery-card" key={project.image}>
          <div className="sh-project-gallery-image"><Image src={`/images/projects/${project.image}.webp`} alt={project.alt} fill sizes="(max-width: 700px) 75vw, 30vw"/></div>
          <div className="sh-project-gallery-caption"><span>{project.label}</span><h3>{project.title}</h3><span className="sh-project-gallery-link">Explore this project type</span></div>
        </Link>)}
      </div>
      <p className="sh-project-gallery-note">Illustrative solar project concepts.<span>Swipe to explore</span></p>
    </section>

    <section className="sh-section sh-care" id="why-samerika" aria-labelledby="care-heading"><div className="sh-care-layout">
      <div className="sh-care-intro"><span className="sh-eyebrow">THE SAMERIKA APPROACH</span><h2 id="care-heading">The right team.<br/><em>A simpler<br/> solar journey.</em></h2><p>From understanding your rooftop to keeping your project connected, we bring the details together.</p><Link href="/enquiry" scroll={false} className="sh-button sh-primary">Let’s plan together <ArrowRight size={17}/></Link><span className="sh-care-signoff"><ShieldCheck size={17}/> Clear steps. Connected people.</span><Sun className="sh-care-sun" aria-hidden="true" size={200} strokeWidth={.6}/></div>
      <div className="sh-care-grid">{benefits.map(({ icon: Icon, title, text }, index) => <article className="sh-care-card" key={title}><div className="sh-care-card-top"><span className={`sh-care-icon tone-${index}`}><Icon size={24} strokeWidth={1.7}/></span><span className="sh-care-number">0{index+1}</span></div><h3>{title}</h3><p>{text}</p></article>)}</div>
    </div></section>

    <section className="sh-section sh-connected" id="your-solar-journey" aria-labelledby="connected-heading">
      <div className="sh-connected-panel">
        <div className="sh-connected-photo"><Image src="/images/samerika-rooftop-hero.webp" alt="Solar panels over an illustrative residential rooftop terrace" fill sizes="(max-width: 700px) 900px, 1000px"/>
          <span className="sh-connected-photo-label"><Leaf size={15}/> A BRIGHTER WAY TO POWER YOUR DAY</span>
          <div className="sh-connected-caption"><span className="sh-connected-caption-icon"><Sun size={24}/></span><h3>Good energy.<br/>A new purpose for <em>your roof.</em></h3><p>Thoughtfully planned around your space.</p></div>
        </div>
        <div className="sh-connected-content"><span className="sh-eyebrow">MORE THAN PANELS ON A ROOF</span><h2 id="connected-heading">Your solar journey.<br/><em>All connected.</em></h2><p className="sh-connected-description">One company team to bring your requirements, quotation and project milestones together.</p>
          <ol className="sh-connected-steps">{[
            {Icon:MessageCircle,title:'Start with a conversation',text:'Share your space, electricity needs and questions.'},
            {Icon:FileText,title:'Make an informed choice',text:'Review your proposed system and detailed quotation.'},
            {Icon:ClipboardCheck,title:'Stay connected to progress',text:'Follow the milestones recorded by your company team.'},
          ].map(({Icon,title,text},index)=><li key={title}><span className={`sh-connected-step-icon step-${index}`}><Icon size={21} strokeWidth={1.7}/></span><div><h3>{title}</h3><p>{text}</p></div><span className="sh-connected-step-number">0{index+1}</span></li>)}</ol>
          <div className="sh-connected-actions"><Link href="/enquiry" scroll={false} className="sh-button sh-primary">Plan my solar project <ArrowRight size={18}/></Link><a href="#how-it-works">How it works <ArrowUpRight size={15}/></a></div>
          <p className="sh-connected-reassurance"><ShieldCheck size={14}/> No account needed to start an enquiry.</p>
        </div>
      </div>
    </section>

    <SolarPlanner/>

    <section className="sh-section sh-roadmap" id="how-it-works" aria-labelledby="roadmap-heading">
      <div className="sh-roadmap-heading">
        <div><span className="sh-eyebrow">FROM FIRST HELLO TO HANDOVER</span><h2 id="roadmap-heading">One journey.<br/><em>Every step, connected.</em></h2></div>
        <div className="sh-roadmap-summary"><span><Sun size={19}/> THE WAY TO YOUR SOLAR ROOFTOP</span><p>Four simple stages to understand what comes next—with your company team along the way.</p></div>
      </div>
      <ol className="sh-roadmap-steps">{journey.map(({title,text,icon:Icon,label,detail},index)=><li className={`sh-roadmap-step stage-${index}`} key={title}>
        <div className="sh-roadmap-marker"><span>0{index+1}</span><span className="sh-roadmap-connector" aria-hidden="true"><ArrowRight size={14}/></span></div>
        <article className="sh-roadmap-card"><div className="sh-roadmap-card-top"><span className="sh-roadmap-icon"><Icon size={25} strokeWidth={1.7}/></span><span className="sh-roadmap-stage">STEP 0{index+1}</span></div><span className="sh-roadmap-label">{label}</span><h3>{title}</h3><p>{text}</p><div className="sh-roadmap-detail"><Check size={14}/><span>{detail}</span></div></article>
      </li>)}</ol>
      <div className="sh-roadmap-footer"><div><span className="sh-roadmap-footer-icon"><MessageCircle size={22}/></span><div><h3>Your first step is a conversation.</h3><p>Share a few details. Our staff will take it from there.</p></div></div><Link href="/enquiry" scroll={false} className="sh-button sh-primary">Start my solar journey <ArrowRight size={18}/></Link></div>
    </section>

    <section className="sh-section sh-project" id="project-tracking" aria-labelledby="project-heading">
      <div className="sh-project-copy">
        <span className="sh-eyebrow">A CLEARER PICTURE AT EVERY STAGE</span>
        <h2 id="project-heading">Your solar story.<br/><em>Progress you can follow.</em></h2>
        <p>From application to installation, keep your project details and the next milestone in view.</p>
        <ul className="sh-project-features">{[
          {Icon:ClipboardCheck,title:'Know where things stand',text:'Review application stages and reference details.'},
          {Icon:FileText,title:'Keep the details together',text:'Find installation milestones and project documents.'},
          {Icon:Users,title:'Stay in step with your team',text:'Follow the updates recorded by your company staff.'},
        ].map(({Icon,title,text},index)=><li key={title}><span className={`sh-project-feature-icon tone-${index}`}><Icon size={21} strokeWidth={1.7}/></span><div><h3>{title}</h3><p>{text}</p></div></li>)}</ul>
      </div>
      <figure className="sh-project-solar-image">
        <Image src="/images/solar-project-team.webp" alt="Illustration of two solar professionals reviewing a tablet beside rooftop solar panels" width={1200} height={1200} sizes="(max-width: 700px) 88vw, 46vw"/>
        <figcaption><Leaf size={16} aria-hidden="true"/> Solar installation team · Illustration</figcaption>
      </figure>
    </section>

    <section className="sh-section sh-answers" id="faqs" aria-labelledby="answers-heading">
      <div className="sh-answers-intro"><span className="sh-eyebrow">GOOD QUESTIONS. CLEAR ANSWERS.</span><h2 id="answers-heading">A little clarity.<br/><em>A confident start.</em></h2><p>From your first enquiry to following your project, here’s what helps to know.</p>
        <div className="sh-answers-help"><span className="sh-answers-help-icon"><MessageCircle size={24} strokeWidth={1.7}/></span><h3>Have something else in mind?</h3><p>Tell us about your rooftop and your questions. Our company staff will follow up.</p><Link href="/enquiry" scroll={false}>Talk to our solar team <ArrowRight size={17}/></Link><span className="sh-answers-help-note"><ShieldCheck size={14}/> No account needed to enquire.</span></div>
      </div>
      <HomeFaqs items={faqs}/>
    </section>

    <div className="sh-closing" id="get-in-touch">
      <section className="sh-invitation" aria-labelledby="invitation-heading"><div className="sh-invitation-card">
        <div className="sh-invitation-copy"><span className="sh-invitation-label"><Sun size={19}/> A NEW CHAPTER FOR YOUR ROOFTOP</span><h2 id="invitation-heading">Good energy starts<br/><em>with a conversation.</em></h2><p>Tell us about your space. Let’s explore a solar plan that fits.</p></div>
        <div className="sh-invitation-action"><Link href="/enquiry?interest=callback" scroll={false} className="sh-button sh-dark">Request a Callback <ArrowRight size={19}/></Link><span><ShieldCheck size={15}/> No account needed. Our staff will follow up.</span></div>
        <Sun className="sh-invitation-sun" size={310} strokeWidth={.65} aria-hidden="true"/>
      </div></section>

    </div>
    <div className="sh-mobile-cta"><Link href="/enquiry?interest=site-visit" scroll={false} className="sh-button sh-primary">Book Free Site Visit <ArrowRight size={17}/></Link></div>
  </main>;
}
