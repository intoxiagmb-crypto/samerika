'use client';

import { useState } from 'react';
import PublicHeader from '@/components/public-header';
import Image from 'next/image';
import Link from 'next/link';
import Brand from '@/components/brand';
import SolarPlanner from '@/components/solar-planner';
import { ArrowRight, ArrowUpRight, Building2, Check, CheckCircle2, ClipboardCheck, FileText, House, Leaf, MessageCircle, Minus, PanelsTopLeft, Plus, ShieldCheck, Sun, Users, Clock3, Headphones, BriefcaseBusiness } from 'lucide-react';
import './home.css';

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
  ['How do I get started with Samerika Power?', 'Send an enquiry with your name, mobile number, email and site location. Our company staff will contact you to understand your requirements and discuss the next steps. You do not need an account to enquire.'],
  ['Which solar system is right for my property?', 'The right system depends on your electricity use, available rooftop space and site conditions. Share your requirement first; the team confirms the design and capacity after assessing your site.'],
  ['What will my solar quotation include?', 'Your quotation can include the selected panels, inverter, accessories and services, along with quantities, applicable taxes, pricing and terms. Review the proposed scope with the team before proceeding.'],
  ['Can I track my application and installation?', 'Yes. Your project workspace shows the milestones recorded by the company team. Application stages and installation progress are tracked separately, with status dates and references where available. Government application updates are recorded manually.'],
  ['Will a subsidy apply to my project?', 'Ask the company team to check the requirements that apply to your property and application. Eligibility, approval and disbursal must be confirmed through the relevant process; submitting an enquiry does not guarantee a subsidy.'],
  ['Which login should I choose?', 'Company owners and administrators use Company login. Employees use Company Staff login. Channel partners use Agent login to follow their own referrals, projects and approved earnings.'],
];

export default function HomePage() {
  const [faq, setFaq] = useState<number | null>(0);
  return <main className="samerika-home">
    <a className="sh-skip" href="#home-content">Skip to content</a>
    <PublicHeader/>

    <section className="sh-hero" id="home-content" aria-labelledby="home-title">
      <Image src="/images/samerika-rooftop-hero.webp" alt="Illustrative rooftop solar canopy over a sunlit Indian home terrace" fill sizes="(max-width: 700px) 1200px, 100vw" preload className="sh-hero-image"/>
      <div className="sh-hero-shade"/>
      <div className="sh-hero-content"><span className="sh-eyebrow"><span/> SOLAR POWER. EVERYDAY POSSIBILITIES.</span><h1 id="home-title">A brighter future.<br/>Starts on <span>your roof.</span></h1><p>Make your move to solar with a team that connects every step—from your first enquiry to installation.</p><div className="sh-hero-actions"><Link href="/enquiry" className="sh-button sh-primary">Let’s talk solar <ArrowRight size={19}/></Link><a href="#solutions" className="sh-hero-link">Explore our solutions <ArrowUpRight size={18}/></a></div><div className="sh-hero-promise"><ShieldCheck size={19}/><span>Your rooftop. Your requirements. A plan built around you.</span></div></div>
      <div className="sh-hero-bottom"><span><ClipboardCheck size={19}/> Site-led planning</span><span><FileText size={19}/> Clear quotations</span><span><CheckCircle2 size={19}/> Connected project tracking</span></div>
    </section>

    <section className="sh-section sh-solutions" id="solutions" aria-labelledby="solutions-heading">
      <div className="sh-solutions-heading"><div><span className="sh-eyebrow">A SOLAR SOLUTION FOR YOUR SPACE</span><h2 id="solutions-heading">Bring solar to <em>your world.</em></h2></div><p>Choose your space. We’ll help you take<br className="sh-solutions-break"/> the next step towards solar.</p></div>
      <div className="sh-solutions-grid">{offerings.map(({ title, icon: Icon, property, description, note, className, category, features, cta }) => <Link href={`/enquiry?property=${property}`} className={`sh-solution-card ${className}`} key={title} aria-label={`${cta} — send an enquiry`}>
        <div className="sh-solution-top"><span className="sh-solution-icon"><Icon size={34} strokeWidth={1.65}/></span><span className="sh-solution-category">{category}</span><Sun className="sh-solution-sun" size={110} strokeWidth={.8} aria-hidden="true"/></div>
        <div className="sh-solution-body"><span className="sh-solution-note">{note}</span><h3>{title}</h3><p>{description}</p><ul>{features.map(feature=><li key={feature}><Check size={14}/>{feature}</li>)}</ul><div className="sh-solution-cta"><span>{cta}</span><span className="sh-solution-arrow"><ArrowUpRight size={19}/></span></div></div>
      </Link>)}</div>
      <p className="sh-solutions-help"><MessageCircle size={16}/> Not sure where to start? <Link href="/enquiry">Talk to our solar team <ArrowRight size={14}/></Link></p>
    </section>

    <section className="sh-section sh-care" id="why-samerika" aria-labelledby="care-heading"><div className="sh-care-layout">
      <div className="sh-care-intro"><span className="sh-eyebrow">THE SAMERIKA APPROACH</span><h2 id="care-heading">The right team.<br/><em>A simpler<br/> solar journey.</em></h2><p>From understanding your rooftop to keeping your project connected, we bring the details together.</p><Link href="/enquiry" className="sh-button sh-primary">Let’s plan together <ArrowRight size={17}/></Link><span className="sh-care-signoff"><ShieldCheck size={17}/> Clear steps. Connected people.</span><Sun className="sh-care-sun" aria-hidden="true" size={200} strokeWidth={.6}/></div>
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
          <div className="sh-connected-actions"><Link href="/enquiry" className="sh-button sh-primary">Plan my solar project <ArrowRight size={18}/></Link><a href="#how-it-works">How it works <ArrowUpRight size={15}/></a></div>
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
      <div className="sh-roadmap-footer"><div><span className="sh-roadmap-footer-icon"><MessageCircle size={22}/></span><div><h3>Your first step is a conversation.</h3><p>Share a few details. Our staff will take it from there.</p></div></div><Link href="/enquiry" className="sh-button sh-primary">Start my solar journey <ArrowRight size={18}/></Link></div>
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
        <Link href="/portal?view=tracking" className="sh-button sh-primary">Open project tracking <ArrowRight size={18}/></Link>
        <p className="sh-project-signin"><ShieldCheck size={15}/> Sign in to view your project workspace.</p>
      </div>
      <div className="sh-project-preview" role="group" aria-label="Illustrative application tracking preview">
        <div className="sh-project-preview-top"><span><Sun size={17}/> MY SOLAR JOURNEY</span><span className="sh-project-example">Sample preview</span></div>
        <div className="sh-project-overview">
          <div><span className="sh-project-overline">APPLICATION OVERVIEW</span><h3>Every milestone.<br/>A little closer.</h3><p>2 of 10 stages completed</p></div>
          <div className="sh-project-ring" role="progressbar" aria-label="Sample application stages completed" aria-valuenow={2} aria-valuemin={0} aria-valuemax={10} aria-valuetext="2 of 10 stages completed"><div><strong>20<span>%</span></strong><small>completed</small></div></div>
        </div>
        <div className="sh-project-counts"><div><span className="done"/><strong>02</strong><span>Completed</span></div><div><span className="active"/><strong>01</strong><span>In progress</span></div><div><span className="waiting"/><strong>07</strong><span>Pending</span></div></div>
        <div className="sh-project-timeline"><div className="sh-project-timeline-title"><h4>Application milestones</h4><span>Showing 4 of 10</span></div>
          <ol>{[
            {label:'Registration',status:'Completed',detail:'Recorded by your team',state:'done'},
            {label:'Application',status:'Completed',detail:'Recorded by your team',state:'done'},
            {label:'Feasibility',status:'In progress',detail:'Current milestone with your team',state:'active'},
            {label:'Vendor selection',status:'Pending',detail:'Awaiting an update',state:'waiting'},
          ].map(({label,status,detail,state},index)=><li key={label} className={state}><span className="sh-project-node">{state==='done'?<Check size={15}/>:state==='active'?<Clock3 size={15}/>:<span>0{index+1}</span>}</span><div className="sh-project-milestone"><strong>{label}</strong><small>{detail}</small></div><span className="sh-project-status">{status}</span></li>)}</ol>
          <p className="sh-project-remaining">+ 6 more stages in your project workspace</p>
        </div>
        <div className="sh-project-preview-note"><ShieldCheck size={15}/><p>Illustrative stages. Your workspace shows updates recorded by your company team.</p></div>
      </div>
    </section>

    <section className="sh-section sh-workspaces" id="portals" aria-labelledby="workspaces-heading">
      <div className="sh-workspaces-heading"><div><span className="sh-eyebrow">ALREADY PART OF THE TEAM?</span><h2 id="workspaces-heading">Your role.<br/><em>Your workspace.</em></h2></div><p>Choose the login that fits your role.<br/> Pick up right where you left off.</p></div>
      <div className="sh-workspaces-grid">{[
        {title:'Company login',role:'Owners & administrators',text:'Keep your company, team and solar projects moving together.',features:['Business overview','Team management'],cta:'Open company login',href:'/login/company',Icon:Building2,tone:'company',label:'MANAGE & GROW'},
        {title:'Company staff login',role:'Company employees',text:'Follow up on enquiries and manage the work assigned to your role.',features:['Enquiries & follow-ups','Project coordination'],cta:'Open staff login',href:'/login/staff',Icon:BriefcaseBusiness,tone:'staff',label:'ORGANISE & DELIVER'},
        {title:'Agent login',role:'Channel partners & agents',text:'Stay connected to your referrals, projects and approved earnings.',features:['Your referrals','Approved earnings'],cta:'Open agent login',href:'/login/agent',Icon:Users,tone:'agent',label:'REFER & CONNECT'},
      ].map(({title,role,text,features,cta,href,Icon,tone,label})=><Link key={href} href={href} className={`sh-workspace-card ${tone}`} aria-label={cta}>
        <div className="sh-workspace-top"><span className="sh-workspace-icon"><Icon size={27} strokeWidth={1.7}/></span><span className="sh-workspace-label">{label}</span></div>
        <div className="sh-workspace-body"><span className="sh-workspace-role">{role}</span><h3>{title}</h3><p>{text}</p><ul>{features.map(feature=><li key={feature}><Check size={13}/>{feature}</li>)}</ul></div>
        <div className="sh-workspace-action"><span>{cta}</span><span><ArrowRight size={18}/></span></div>
      </Link>)}</div>
      <div className="sh-workspaces-note"><span><ShieldCheck size={16}/> Your access follows your assigned role.</span><p>Exploring solar for your property? <Link href="/enquiry">Start an enquiry <ArrowUpRight size={15}/></Link></p></div>
    </section>

    <section className="sh-section sh-answers" id="faqs" aria-labelledby="answers-heading">
      <div className="sh-answers-intro"><span className="sh-eyebrow">GOOD QUESTIONS. CLEAR ANSWERS.</span><h2 id="answers-heading">A little clarity.<br/><em>A confident start.</em></h2><p>From your first enquiry to following your project, here’s what helps to know.</p>
        <div className="sh-answers-help"><span className="sh-answers-help-icon"><MessageCircle size={24} strokeWidth={1.7}/></span><h3>Have something else in mind?</h3><p>Tell us about your rooftop and your questions. Our company staff will follow up.</p><Link href="/enquiry">Talk to our solar team <ArrowRight size={17}/></Link><span className="sh-answers-help-note"><ShieldCheck size={14}/> No account needed to enquire.</span></div>
      </div>
      <div className="sh-answers-list" aria-label="Frequently asked questions">{faqs.map(([question,answer],index)=><article key={question} className={`sh-answer ${faq===index?'is-open':''}`}>
        <h3><button type="button" aria-expanded={faq===index} aria-controls={`home-faq-${index}`} id={`home-faq-button-${index}`} onClick={()=>setFaq(faq===index?null:index)}><span className="sh-answer-number" aria-hidden="true">0{index+1}</span><span className="sh-answer-question">{question}</span><span className="sh-answer-toggle" aria-hidden="true">{faq===index?<Minus size={17}/>:<Plus size={17}/>}</span></button></h3>
        <div className="sh-answer-content" id={`home-faq-${index}`} role="region" aria-labelledby={`home-faq-button-${index}`} hidden={faq!==index}><p>{answer}</p></div>
      </article>)}<p className="sh-answers-signoff"><Sun size={15}/> A clearer next step starts with the right information.</p></div>
    </section>

    <div className="sh-closing" id="get-in-touch">
      <section className="sh-invitation" aria-labelledby="invitation-heading"><div className="sh-invitation-card">
        <div className="sh-invitation-copy"><span className="sh-invitation-label"><Sun size={19}/> A NEW CHAPTER FOR YOUR ROOFTOP</span><h2 id="invitation-heading">Good energy starts<br/><em>with a conversation.</em></h2><p>Tell us about your space. Let’s explore a solar plan that fits.</p></div>
        <div className="sh-invitation-action"><Link href="/enquiry" className="sh-button sh-dark">Talk to our solar team <ArrowRight size={19}/></Link><span><ShieldCheck size={15}/> No account needed. Our staff will follow up.</span></div>
        <Sun className="sh-invitation-sun" size={310} strokeWidth={.65} aria-hidden="true"/>
      </div></section>
      <footer className="sh-site-footer">
        <div className="sh-site-footer-main">
          <div className="sh-site-footer-brand"><Brand/><p>Samerika Power Private Limited</p><span>Solar for your space.<br/> People to connect every step.</span><span className="sh-site-footer-tag"><Leaf size={15}/> Better energy. Better connected.</span></div>
          <nav className="sh-site-footer-nav" aria-label="Explore solar footer navigation"><h3>Explore solar</h3><Link href="/about">About Us</Link><a href="#solutions">Our offerings</a><a href="#why-samerika">Why Samerika</a><a href="#how-it-works">How it works</a><a href="#faqs">FAQs & answers</a></nav>
          <nav className="sh-site-footer-nav" aria-label="Workspace footer navigation"><h3>Your workspace</h3><Link href="/login/company">Company login</Link><Link href="/login/staff">Company staff login</Link><Link href="/login/agent">Agent login</Link><Link href="/portal?view=tracking">Project tracking <ArrowUpRight size={13}/></Link></nav>
          <div className="sh-site-footer-help"><span className="sh-site-footer-help-icon"><MessageCircle size={22}/></span><h3>Let’s find your next step.</h3><p>Share your site details and questions with our company team.</p><Link href="/enquiry">Send an enquiry <ArrowRight size={16}/></Link></div>
        </div>
        <div className="sh-site-footer-bottom"><span>© {new Date().getFullYear()} Samerika Power Private Limited</span><span className="sh-site-footer-motto"><Sun size={14}/> A brighter tomorrow starts today.</span><a href="#home-content">Back to top <span><ArrowUpRight size={16}/></span></a></div>
      </footer>
    </div>
    <div className="sh-mobile-cta"><Link href="/login" className="sh-button sh-outline">Sign in <ArrowUpRight size={16}/></Link><Link href="/enquiry" className="sh-button sh-primary">Enquire now <ArrowRight size={17}/></Link></div>
  </main>;
}
