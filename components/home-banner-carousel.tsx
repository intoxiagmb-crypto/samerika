'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ArrowUpRight, CheckCircle2, ClipboardCheck, FileText, Leaf, ShieldCheck, Sun } from 'lucide-react';
import { startBannerRotation } from '@/lib/home-banner-rotation.mjs';

export default function HomeBannerCarousel() {
  const [active, setActive] = useState(0);
  const [hidden, setHidden] = useState(false);
  const touch = useRef<{x:number;y:number} | null>(null);
  const pathname = usePathname();
  const running = !hidden && pathname === '/';
  const choose = (index:number) => setActive((index + 3) % 3);

  useEffect(() => {
    const updateVisibility = () => setHidden(document.hidden);
    updateVisibility();
    document.addEventListener('visibilitychange', updateVisibility);
    return () => document.removeEventListener('visibilitychange', updateVisibility);
  }, []);
  useEffect(() => {
    if (!running) return;
    return startBannerRotation(() => setActive(current => (current + 1) % 3));
  }, [running, active]);

  return <section className="sh-banner-carousel" id="home-content" aria-label="Explore solar with Samerika" aria-roledescription="carousel"
    onTouchStart={event => { const point = event.touches[0]; touch.current = {x:point.clientX,y:point.clientY}; }}
    onTouchCancel={() => { touch.current = null; }}
    onTouchEnd={event => { const start = touch.current; touch.current = null; if (!start) return; const point = event.changedTouches[0]; const dx = point.clientX - start.x; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(point.clientY - start.y) * 1.5) choose(active + (dx < 0 ? 1 : -1)); }}>
    <div className="sh-banner-stage" aria-live={running ? 'off' : 'polite'}>
      <div className={`sh-hero sh-banner-slide ${active === 0 ? 'is-active' : ''}`} role="group" aria-roledescription="slide" aria-label="1 of 3: Your rooftop" aria-hidden={active !== 0} inert={active !== 0}>
        <Image src="/images/samerika-rooftop-hero.webp" alt="Illustrative rooftop solar canopy over a sunlit Indian home terrace" fill sizes="(max-width: 700px) 1200px, 100vw" preload className="sh-hero-image"/>
        <div className="sh-hero-shade"/>
        <div className="sh-hero-content"><span className="sh-eyebrow"><span/> SOLAR POWER. EVERYDAY POSSIBILITIES.</span><h1 id="home-title">A brighter future.<br/>Starts on <span>your roof.</span></h1><p>Make your move to solar with a team that connects every step—from your first enquiry to installation.</p><div className="sh-hero-actions"><Link href="/enquiry" scroll={false} className="sh-button sh-primary">Get Free Solar Quote <ArrowRight size={19}/></Link><a href="#solutions" className="sh-hero-link">Explore our solutions <ArrowUpRight size={18}/></a></div><div className="sh-hero-promise"><ShieldCheck size={19}/><span>Your rooftop. Your requirements. A plan built around you.</span></div></div>
        <div className="sh-hero-bottom"><span><ClipboardCheck size={19}/> Site-led planning</span><span><FileText size={19}/> Clear quotations</span><span><CheckCircle2 size={19}/> Connected project tracking</span></div>
      </div>
      <div className={`sh-hero sh-banner-slide sh-banner-green ${active === 1 ? 'is-active' : ''}`} role="group" aria-roledescription="slide" aria-label="2 of 3: Solar for your home" aria-hidden={active !== 1} inert={active !== 1}>
        <div className="sh-banner-art"><Image src="/images/projects/residential.webp" alt="Illustrative family home with solar panels on its roof" fill sizes="100vw"/><span><Leaf size={17}/> A little sunshine. A new beginning.</span></div>
        <div className="sh-hero-content"><span className="sh-eyebrow"><span/> YOUR HOME. A FRESH START.</span><h2 className="sh-banner-title">Bring sunshine<br/>home.<br/><em>Every day.</em></h2><p>Give your rooftop a new purpose. Explore home solar and PM Surya Ghar guidance with Samerika.</p><div className="sh-hero-actions"><Link href="/enquiry?property=Residential&program=pm-surya-ghar" scroll={false} className="sh-button">Explore Home Solar <ArrowRight size={19}/></Link><Link href="/programs" className="sh-hero-link">Subsidy guidance <ArrowUpRight size={18}/></Link></div><div className="sh-hero-promise"><ShieldCheck size={19}/><span>Personalised planning for your family and your roof.</span></div></div>
      </div>
      <div className={`sh-hero sh-banner-slide sh-banner-gold ${active === 2 ? 'is-active' : ''}`} role="group" aria-roledescription="slide" aria-label="3 of 3: Solar for your business" aria-hidden={active !== 2} inert={active !== 2}>
        <div className="sh-banner-art"><Image src="/images/projects/commercial.webp" alt="Illustrative commercial building with rooftop solar panels" fill sizes="100vw"/><span><Sun size={18}/> More purpose for your business roof.</span></div>
        <div className="sh-hero-content"><span className="sh-eyebrow"><span/> AMBITION, POWERED BY THE SUN.</span><h2 className="sh-banner-title">Your business.<br/>A brighter<br/><em>tomorrow.</em></h2><p>Put your roof to work. Plan a solar system around your premises, operations and energy needs.</p><div className="sh-hero-actions"><Link href="/enquiry?property=Commercial" scroll={false} className="sh-button">Plan Business Solar <ArrowRight size={19}/></Link><Link href="/projects#project-business" className="sh-hero-link">Explore project types <ArrowUpRight size={18}/></Link></div><div className="sh-hero-promise"><ClipboardCheck size={19}/><span>From site assessment to a clear, detailed quotation.</span></div></div>
      </div>
    </div>
    <div className={`sh-banner-controls ${active ? 'on-light' : ''}`}>
      <div className="sh-banner-dots" aria-label="Choose a banner">{['Your rooftop','Home solar','Business solar'].map((label,index)=><button key={label} type="button" aria-label={`Show banner ${index+1}: ${label}`} aria-current={active === index ? 'true' : undefined} onClick={() => choose(index)}><span/></button>)}</div>
      <span className="sh-banner-count" aria-hidden="true">0{active+1} / 03</span>
    </div>
  </section>;
}
