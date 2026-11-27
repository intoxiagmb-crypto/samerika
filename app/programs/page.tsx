import type {Metadata} from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {Check, ClipboardCheck, FileText, House, Leaf, Sun} from 'lucide-react';
import PublicHeader from '@/components/public-header';
import '../home.css';
import './programs.css';

export const metadata: Metadata = {
  title: 'PM Surya Ghar Solar Program | Samerika Power',
  description: 'Explore PM Surya Ghar – Muft Bijli Yojana: residential solar subsidies in Uttar Pradesh, eligibility, documents and application steps.',
};

const enquiry = '/enquiry?property=Residential&program=pm-surya-ghar';
const portal = 'https://pmsuryaghar.gov.in/';
const stateSource = 'https://solarcitiesportal.upneda.org.in/';
const eligibilitySource = 'https://static.pib.gov.in/WriteReadData/specificdocs/documents/2025/mar/doc2025313520001.pdf';
const documentSource = 'https://cdnbbsr.s3waas.gov.in/s3716e1b8c6cd17b771da77391355749f3/uploads/2026/03/202603191833866183.pdf';
const subsidies = [
  {capacity: '1 kW', central: '₹30,000', state: '₹15,000', total: '₹45,000'},
  {capacity: '2 kW', central: '₹60,000', state: '₹30,000', total: '₹90,000'},
  {capacity: '3 kW', central: '₹78,000', state: '₹30,000', total: '₹1,08,000'},
  {capacity: 'Above 3 kW', central: '₹78,000', state: '₹30,000', total: '₹1,08,000'},
];
const eligibility = [
  'An Indian household with a valid, active residential electricity connection.',
  'A home with a suitable roof and the right to install a grid-connected solar system.',
  'Prior solar subsidy claims must be checked against the scheme’s eligibility rules.',
  'UP state support applies to eligible residential installations in Uttar Pradesh.',
];
const steps = [
  {title: 'Register on the official portal', text: 'Select your state and DISCOM, enter your electricity consumer details and complete the rooftop solar application.'},
  {title: 'Confirm the installation requirements', text: 'Follow the portal’s DISCOM approval process. Select a registered vendor and agree on system capacity, equipment, price and scope.'},
  {title: 'Install and commission your system', text: 'Use scheme-compliant equipment, including the required domestic solar modules and cells. Complete net metering, inspection and commissioning with your DISCOM.'},
  {title: 'Submit the subsidy claim', text: 'Provide the required bank details and supporting records on the official portal. Track verification and payment, including the applicable UP state process.'},
];
const faqs = [
  {question: 'Does every home receive ₹1,08,000?', answer: 'No. This is the combined maximum for eligible individual households in Uttar Pradesh with a system of 3 kW or more. The actual amount depends on approved capacity and central and state eligibility. Other states have their own support rules.'},
  {question: 'Will my electricity bill become zero?', answer: 'Savings depend on solar generation, household consumption, weather, net-metering rules and applicable electricity charges. The scheme’s aim of up to 300 units of free electricity does not guarantee a zero bill every month.'},
  {question: 'Can a shop, factory or atta chakki use this subsidy?', answer: 'The household subsidy shown here is for residential electricity connections. Commercial and industrial projects need a separate assessment. Housing societies also have different provisions for common facilities.'},
  {question: 'Is a Samerika enquiry a government application?', answer: 'No. An enquiry starts a conversation with our company team about your rooftop and proposed installation. Government registration, eligibility decisions and subsidy approval take place through the official scheme and DISCOM process.'},
  {question: 'Is financing available?', answer: 'Participating banks offer rooftop solar loans. Interest rates, repayment terms and approval depend on the lender’s current rules and your application. Check the official portal or your bank for the latest offer.'},
];

export default function ProgramsPage() {
  return <div className="samerika-home samerika-programs">
    <a className="sh-skip" href="#program-content">Skip to content</a>
    <PublicHeader programs/>
    <main id="program-content">
      <section className="pg-hero pg-section" aria-labelledby="program-title">
        <div className="pg-hero-copy">
          <span className="pg-eyebrow"><Sun size={19}/> SOLAR PROGRAMS · RESIDENTIAL</span>
          <h1 id="program-title">PM Surya Ghar<br/><em>Muft Bijli Yojana</em></h1>
          <p className="pg-hindi" lang="hi">पीएम सूर्य घर — मुफ्त बिजली योजना</p>
          <h2>Install solar. Save electricity.<br/>Get government subsidy.</h2>
          <p>A Government of India initiative helping households generate solar power at home. Eligible homeowners can access central assistance, with additional state support in Uttar Pradesh.</p>
          <div className="pg-actions"><Link href={enquiry} scroll={false} className="sh-button sh-primary">Discuss my rooftop</Link><a href={portal} target="_blank" rel="noopener noreferrer" className="sh-button sh-outline">Official scheme portal</a></div>
        </div>
        <div className="pg-hero-visual">
          <figure className="pg-image"><Image src="/images/projects/residential.webp" alt="Illustration of a home with rooftop solar panels" fill sizes="(max-width: 850px) 100vw, 50vw" preload/><figcaption><Leaf size={16}/> Rooftop solar illustration</figcaption></figure>
          <div className="pg-support"><span>ELIGIBLE HOUSEHOLDS IN UTTAR PRADESH</span><strong>Up to ₹1,08,000</strong><p>Central + UP state subsidy, subject to approval.</p></div>
        </div>
      </section>

      <nav className="pg-jump" aria-label="Program sections"><a href="#subsidy">Subsidy in UP</a><a href="#eligibility">Eligibility</a><a href="#apply">How to apply</a><a href="#documents">Documents</a><a href="#program-faqs">FAQs</a></nav>

      <section id="subsidy" className="pg-section pg-subsidy" aria-labelledby="subsidy-title">
        <div className="pg-heading"><span className="pg-eyebrow">UNDERSTAND YOUR SUPPORT</span><h2 id="subsidy-title">Subsidy in Uttar Pradesh</h2><p>Central and state assistance for eligible individual residential rooftop installations.</p></div>
        <div className="pg-table-wrap" role="region" aria-label="Uttar Pradesh household solar subsidy table" tabIndex={0}><table><caption>Indicative combined subsidy by solar capacity</caption><thead><tr><th scope="col">Solar capacity</th><th scope="col">Central subsidy</th><th scope="col">UP state subsidy</th><th scope="col">Total support</th></tr></thead><tbody>{subsidies.map(row => <tr key={row.capacity}><th scope="row">{row.capacity}</th><td>{row.central}</td><td>{row.state}</td><td><strong>{row.total}</strong></td></tr>)}</tbody></table></div>
        <div className="pg-table-notes"><p>Central assistance is ₹30,000 per kW for the first 2 kW, plus ₹18,000 for the next 1 kW. UP adds ₹15,000 per kW, capped at ₹30,000 per consumer. Capacity above 3 kW does not increase these caps.</p><p>Subsidy is subject to eligibility, compliant installation, commissioning and government verification. It is not an automatic upfront discount. <a href={stateSource} target="_blank" rel="noopener noreferrer">Source: UPNEDA Solar Cities Portal</a>.</p></div>
      </section>

      <section id="eligibility" className="pg-section pg-eligibility" aria-labelledby="eligibility-title">
        <div className="pg-heading"><span className="pg-icon"><House size={28}/></span><span className="pg-eyebrow">START WITH YOUR HOME</span><h2 id="eligibility-title">Who can apply?</h2><p>Your connection, rooftop and application must meet the scheme and local DISCOM requirements.</p><a className="pg-text-link" href={eligibilitySource} target="_blank" rel="noopener noreferrer">Read the official scheme overview</a></div>
        <ul className="pg-checklist">{eligibility.map(item => <li key={item}><Check size={20}/><span>{item}</span></li>)}</ul>
      </section>

      <section id="apply" className="pg-section" aria-labelledby="apply-title"><div className="pg-heading"><span className="pg-eyebrow">FROM APPLICATION TO SOLAR</span><h2 id="apply-title">Your next steps, explained.</h2><p>Apply through the national portal and follow the instructions for your electricity distribution company.</p></div><ol className="pg-steps">{steps.map(step => <li key={step.title}><h3>{step.title}</h3><p>{step.text}</p></li>)}</ol><a className="pg-text-link" href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2010674" target="_blank" rel="noopener noreferrer">Official application guidance</a></section>

      <section id="documents" className="pg-section pg-documents" aria-labelledby="documents-title"><div className="pg-heading"><span className="pg-icon"><FileText size={28}/></span><span className="pg-eyebrow">KEEP THE DETAILS READY</span><h2 id="documents-title">Documents & information</h2><p>Requirements can vary by application stage. Follow the current checklist on the official portal.</p></div><div className="pg-document-grid"><article><h3>Before you apply</h3><ul><li>Latest electricity bill and consumer number</li><li>State, DISCOM and installation address</li><li>Contact details for portal registration</li></ul></article><article><h3>For commissioning & subsidy</h3><ul><li>Bank details with cancelled cheque or passbook</li><li>Vendor agreement and installation records</li><li>Net-metering agreement and DISCOM commissioning records</li></ul></article><a className="pg-text-link" href={documentSource} target="_blank" rel="noopener noreferrer">MNRE citizen’s charter: required documents</a></div></section>

      <section id="program-faqs" className="pg-section pg-faqs" aria-labelledby="faq-title"><div className="pg-heading"><span className="pg-eyebrow">A LITTLE MORE CLARITY</span><h2 id="faq-title">Questions about the program</h2></div><div className="pg-faq-list">{faqs.map(faq => <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>)}</div></section>

      <section className="pg-section pg-closing" aria-labelledby="program-enquiry-title"><div className="pg-invitation"><ClipboardCheck size={34}/><div><h2 id="program-enquiry-title">Let’s explore your rooftop’s potential.</h2><p>Share your location and electricity needs with Samerika Power.</p></div><Link href={enquiry} scroll={false} className="sh-button sh-primary">Enquire with Samerika</Link></div><div className="pg-source-note"><p>Samerika Power Private Limited is a private company. This information page is not a government application portal. Final eligibility, support and payment follow the applicable government and DISCOM rules.</p><p>Information reviewed: 26 November 2026. <a href={portal} target="_blank" rel="noopener noreferrer">National portal</a> · <a href="https://www.pib.gov.in/PressReleasePage.aspx?PRID=2290407" target="_blank" rel="noopener noreferrer">MNRE update on savings & financing</a></p></div></section>
    </main>
  </div>;
}
