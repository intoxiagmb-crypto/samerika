import Link from 'next/link';
import {ArrowRight, ArrowUpRight, Leaf, MessageCircle, Sun} from 'lucide-react';
import Brand from './brand';

export default function SiteFooter() {
  return <footer className="sh-site-footer global-site-footer">
        <div className="sh-site-footer-main">
          <div className="sh-site-footer-brand"><Brand/><p>Samerika Power Private Limited</p><span>Solar for your space.<br/> People to connect every step.</span><span className="sh-site-footer-tag"><Leaf size={15}/> Better energy. Better connected.</span></div>
          <nav className="sh-site-footer-nav" aria-label="Explore solar footer navigation"><h3>Explore solar</h3><Link href="/about">About Us</Link><Link href="/projects">Projects</Link><a href="/#solutions">Our offerings</a><a href="/#why-samerika">Why Samerika</a><a href="/#how-it-works">How it works</a><a href="/#faqs">FAQs & answers</a></nav>
          <nav className="sh-site-footer-nav" aria-label="Workspace footer navigation"><h3>Your workspace</h3><Link href="/login/company">Company login</Link><Link href="/login/staff">Company staff login</Link><Link href="/login/partner">Partner login</Link><Link href="/portal?view=tracking">Project tracking <ArrowUpRight size={13}/></Link></nav>
          <div className="sh-site-footer-help"><span className="sh-site-footer-help-icon"><MessageCircle size={22}/></span><h3>Let’s find your next step.</h3><p>Share your site details and questions with our company team.</p><Link href="/enquiry">Send an enquiry <ArrowRight size={16}/></Link></div>
        </div>
        <div className="sh-site-footer-bottom"><span>© {new Date().getFullYear()} Samerika Power Private Limited</span><span className="sh-site-footer-motto"><Sun size={14}/> A brighter tomorrow starts today.</span><a href="#site-top">Back to top <span><ArrowUpRight size={16}/></span></a></div>
      </footer>;
}
