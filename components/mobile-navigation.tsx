'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { House, PanelsTopLeft, Calculator, Headphones, UserRound } from 'lucide-react';

const links = [
  { href: '/', label: 'Home', icon: House },
  { href: '/projects', label: 'Projects', icon: PanelsTopLeft },
  { href: '/calculator', label: 'Calculator', icon: Calculator },
  { href: '/contact', label: 'Support', icon: Headphones },
  { href: '/portal', label: 'Profile', icon: UserRound },
];

export default function MobileNavigation({ withinDialog = false }: { withinDialog?: boolean }) {
  const pathname = usePathname();
  // The root menu stays mounted on every route. Modal routes also render it
  // inside their focus trap, above the overlay covering the root menu.
  const isCurrent = (href: string) => href === '/portal'
    ? pathname.startsWith('/portal') || pathname.startsWith('/login')
    : pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
  return <nav className={`solar-mobile-nav${withinDialog ? ' solar-mobile-nav-dialog' : ''}`} aria-label="Mobile navigation">{links.map(({ href, label, icon: Icon }) =>
    <Link key={href} href={href} aria-current={isCurrent(href) ? 'page' : undefined} className={isCurrent(href) ? 'is-current' : ''} onClick={event => {
      // Let an in-flight form finish before leaving its page.
      if (document.querySelector('form[aria-busy="true"], [data-app-saving="true"]')) { event.preventDefault(); return; }
      // Reset the local workspace without reloading the document and its API data.
      // Other destinations use Link's normal client navigation.
      if (pathname === '/portal' && href === '/portal') {
        event.preventDefault();
        window.history.pushState(null, '', href);
        window.dispatchEvent(new PopStateEvent('popstate'));
        window.scrollTo({top:0,behavior:'auto'});
      }
    }}>
      <span><Icon size={21} strokeWidth={1.9}/></span><span>{label}</span>
    </Link>
  )}</nav>;
}
