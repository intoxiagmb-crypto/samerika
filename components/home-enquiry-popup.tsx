'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { claimEnquiryWelcome } from '@/lib/enquiry-welcome.mjs';

let shownWithoutStorage = false;

export default function HomeEnquiryPopup() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (pathname !== '/') return;
    const timer = window.setTimeout(() => {
      let show = false;
      try { show = claimEnquiryWelcome(window.sessionStorage); }
      catch { show = !shownWithoutStorage; shownWithoutStorage = true; }
      if (show) router.push('/enquiry?welcome=1', { scroll: false });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, router]);
  return null;
}
