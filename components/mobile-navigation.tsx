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

export default function MobileNavigation() {
  const pathname = usePathname();
  if (pathname.startsWith('/portal') || pathname.startsWith('/login') || pathname.startsWith('/quotation') || pathname === '/enquiry') return null;
  return <nav className="solar-mobile-nav" aria-label="Mobile navigation">{links.map(({ href, label, icon: Icon }) =>
    <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className={pathname === href ? 'is-current' : ''}>
      <span><Icon size={21} strokeWidth={1.9}/></span><span>{label}</span>
    </Link>
  )}</nav>;
}
