import Link from 'next/link';
import { ArrowUpRight, ClipboardCheck, FileText, Headphones, House, Sun } from 'lucide-react';

const actions = [
  { title: 'Get Free Solar Quote', description: 'अपने सोलर सिस्टम की कीमत जानें।', href: '/enquiry?interest=quote', Icon: FileText, featured: true },
  { title: 'Apply for Solar Subsidy', description: 'सोलर सब्सिडी के लिए मार्गदर्शन लें।', href: '/enquiry?property=Residential&program=pm-surya-ghar', Icon: Sun },
  { title: 'Book Free Site Visit', description: 'अपने घर या साइट के सर्वे का अनुरोध करें।', href: '/enquiry?interest=site-visit', Icon: ClipboardCheck },
  { title: 'Get Your Solar System', description: 'अपनी ज़रूरत के अनुसार सोलर लगवाएं।', href: '/enquiry?interest=solar-system', Icon: House },
  { title: 'Request a Callback', description: 'हमारी टीम से बात करने का अनुरोध करें।', href: '/enquiry?interest=callback', Icon: Headphones },
];

export default function HomeQuickActions() {
  return <section className="sh-quick-actions" aria-labelledby="quick-actions-heading">
    <div className="sh-quick-actions-heading"><span className="sh-eyebrow">LET’S GET STARTED</span><h2 id="quick-actions-heading">Your next step towards solar.</h2></div>
    <div className="sh-quick-actions-grid">{actions.map(({ title, description, href, Icon, featured }) =>
      <Link key={title} href={href} scroll={false} className={`sh-quick-action${featured ? ' is-featured' : ''}`}>
        <div className="sh-quick-action-top"><span className="sh-quick-action-icon"><Icon size={24} strokeWidth={1.7} aria-hidden="true"/></span>{featured && <span className="sh-quick-action-badge">Best Choice</span>}</div>
        <h3>{title}</h3><p lang="hi">{description}</p><ArrowUpRight className="sh-quick-action-arrow" size={20} aria-hidden="true"/>
      </Link>
    )}</div>
  </section>;
}
