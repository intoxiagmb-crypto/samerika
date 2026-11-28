'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import EnquiryForm, { type EnquiryDefaults } from './enquiry-form';
import { markEnquiryWelcomeSeen } from '@/lib/enquiry-welcome.mjs';
import MobileNavigation from '@/components/mobile-navigation';

export default function EnquiryDialog({ intercepted = false, welcome = false, title = 'Get Free Solar Quote', ...defaults }: EnquiryDefaults & { intercepted?: boolean; welcome?: boolean; title?: string }) {
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const close = () => intercepted ? router.back() : router.replace('/', { scroll: false });
  useEffect(() => { try { markEnquiryWelcomeSeen(window.sessionStorage); } catch { markEnquiryWelcomeSeen(undefined); } }, []);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    // Keep the sheet inside the visible area when a mobile keyboard opens.
    const fitViewport = () => {
      if (viewport.scale !== 1) return;
      sheet.current?.style.setProperty('--enquiry-viewport-height', `${viewport.height}px`);
      sheet.current?.style.setProperty('--enquiry-viewport-top', `${viewport.offsetTop}px`);
      sheet.current?.style.setProperty('--enquiry-viewport-bottom', `${Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)}px`);
    };
    fitViewport();
    viewport.addEventListener('resize', fitViewport);
    viewport.addEventListener('scroll', fitViewport);
    return () => {
      viewport.removeEventListener('resize', fitViewport);
      viewport.removeEventListener('scroll', fitViewport);
    };
  }, []);
  return <Dialog.Root open onOpenChange={open => { if (!open) close(); }}>
    <Dialog.Overlay className="quote-enquiry-overlay"/>
    <Dialog.Content ref={sheet} className={`quote-enquiry-sheet${welcome ? ' quote-enquiry-welcome' : ''}`} onOpenAutoFocus={event => { event.preventDefault(); heading.current?.focus(); }}>
      <div className="quote-enquiry-handle" aria-hidden="true"/>
      <Dialog.Close className="quote-enquiry-close" aria-label="Close enquiry"><X size={22}/></Dialog.Close>
      {welcome && <div className="quote-enquiry-welcome-art"><Image src="/images/samerika-rooftop-hero.webp" alt="Illustrative solar canopy on a home rooftop" fill sizes="(max-width: 700px) 1px, 480px"/><div><span>SAMERIKA POWER</span><strong>Solar for your home.<br/>A brighter tomorrow.</strong></div></div>}
      <div className="quote-enquiry-content">
        <header className="quote-enquiry-heading"><Dialog.Title asChild><h1 ref={heading} tabIndex={-1}>{welcome ? <>Switch to solar<br/><em>with Samerika.</em></> : title}</h1></Dialog.Title><Dialog.Description>{welcome ? 'Book a free consultation and explore solar for your rooftop.' : 'Take the first step towards lower electricity bills with solar.'}</Dialog.Description></header>
        <EnquiryForm {...defaults} consultation={welcome} onDone={close}/>
      </div>
      <MobileNavigation withinDialog/>
    </Dialog.Content>
  </Dialog.Root>;
}
