'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {Menu, X} from 'lucide-react';
import Brand from './brand';

export default function PublicHeader({about = false, projects = false}: {about?: boolean; projects?: boolean}) {
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenu(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, []);
  const home = about || projects ? '/' : '';
  return <header className="sh-header">
    <Brand/>
    <nav id="public-navigation" className={`sh-navigation ${menu ? 'is-open' : ''}`} aria-label="Main navigation" onClick={() => setMenu(false)}>
      {(about || projects) && <Link href="/">Home</Link>}
      <Link href="/about" aria-current={about ? 'page' : undefined}>About Us</Link>
      <Link href="/projects" aria-current={projects ? 'page' : undefined}>Projects</Link>
      <a href={`${home}#solutions`}>Our offerings</a>
      {!about && !projects && <a href="#why-samerika">Why Samerika</a>}
      <a href={`${home}#how-it-works`}>How it works</a>
      <a href={`${home}#faqs`}>FAQs</a>
      <Link href="/login" className="sh-nav-login">Sign in</Link>
    </nav>
    <Link href="/enquiry" className="sh-button sh-primary sh-header-cta">Enquire now</Link>
    <button className="sh-menu" aria-label={menu ? 'Close menu' : 'Open menu'} aria-controls="public-navigation" aria-expanded={menu} onClick={() => setMenu(!menu)}>{menu ? <X/> : <Menu/>}</button>
  </header>;
}
