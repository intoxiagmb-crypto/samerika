'use client';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { claimEnquiryWelcome, ENQUIRY_WELCOME_DELAY_MS } from '@/lib/enquiry-welcome.mjs';

export default function HomeEnquiryPopup() {
  const pathname = usePathname();
  const router = useRouter();
  useEffect(() => {
    if (pathname !== '/') return;
    const timer = window.setTimeout(() => {
      let show = false;
      try { show = claimEnquiryWelcome(window.sessionStorage); }
      catch { show = claimEnquiryWelcome(undefined); }
      if (show) router.push('/enquiry?welcome=1', { scroll: false });
    }, ENQUIRY_WELCOME_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [pathname, router]);
  return null;
}
