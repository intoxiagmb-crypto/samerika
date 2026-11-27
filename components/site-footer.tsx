import Link from 'next/link';
import {ArrowUp, Leaf, MessageCircle} from 'lucide-react';
import Brand from './brand';

export default function SiteFooter() {
  return <footer id="site-footer" className="sh-site-footer global-site-footer">
    <div className="sh-site-footer-main">
      <div className="sh-site-footer-brand">
        <Brand/>
        <p>Samerika Power Private Limited</p>
        <span>Solar for your space.<br/>People to connect every step.</span>
        <span className="sh-site-footer-tag"><Leaf size={18} aria-hidden="true"/> Better energy. Better connected.</span>
      </div>
      <div className="sh-site-footer-links">
        <nav className="sh-site-footer-nav" aria-label="Explore solar footer navigation">
          <h3>Explore solar</h3>
          <Link href="/about">About Us</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/programs">Programs</Link>
          <a href="/#solutions">Our offerings</a>
        </nav>
        <nav className="sh-site-footer-nav" aria-label="Helpful information footer navigation">
          <h3>Helpful links</h3>
          <a href="/#why-samerika">Why Samerika</a>
          <a href="/#how-it-works">How it works</a>
          <a href="/#faqs">FAQs & answers</a>
          <Link href="/enquiry" scroll={false}>Contact our team</Link>
        </nav>
      </div>
      <div className="sh-site-footer-help">
        <span className="sh-site-footer-help-icon"><MessageCircle size={23} aria-hidden="true"/></span>
        <div className="sh-site-footer-help-copy"><h3>Let’s talk solar.</h3><p>Tell us about your rooftop.<br/>We’ll help you plan the next step.</p></div>
        <Link href="/enquiry" scroll={false}>Send an enquiry</Link>
      </div>
    </div>
    <div className="sh-site-footer-bottom"><span>© {new Date().getFullYear()} Samerika Power Private Limited</span><a href="#site-top">Back to top <span><ArrowUp size={18} aria-hidden="true"/></span></a></div>
  </footer>;
}
