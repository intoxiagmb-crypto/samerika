'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Dialog } from 'radix-ui';
import { X } from 'lucide-react';
import EnquiryForm, { type EnquiryDefaults } from './enquiry-form';
import { ENQUIRY_WELCOME_KEY } from '@/lib/enquiry-welcome.mjs';

export default function EnquiryDialog({ intercepted = false, welcome = false, ...defaults }: EnquiryDefaults & { intercepted?: boolean; welcome?: boolean }) {
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const close = () => intercepted ? router.back() : router.replace('/', { scroll: false });
  useEffect(() => { try { window.sessionStorage.setItem(ENQUIRY_WELCOME_KEY, '1'); } catch { /* The form also works when browser storage is disabled. */ } }, []);
  return <Dialog.Root open onOpenChange={open => { if (!open) close(); }}>
    <Dialog.Overlay className="quote-enquiry-overlay"/>
    <Dialog.Content className={`quote-enquiry-sheet${welcome ? ' quote-enquiry-welcome' : ''}`} onOpenAutoFocus={event => { event.preventDefault(); heading.current?.focus(); }}>
      <div className="quote-enquiry-handle" aria-hidden="true"/>
      <Dialog.Close className="quote-enquiry-close" aria-label="Close enquiry"><X size={22}/></Dialog.Close>
      {welcome && <div className="quote-enquiry-welcome-art"><Image src="/images/samerika-rooftop-hero.webp" alt="Illustrative solar canopy on a home rooftop" fill sizes="(max-width: 700px) 1px, 480px"/><div><span>SAMERIKA POWER</span><strong>Solar for your home.<br/>A brighter tomorrow.</strong></div></div>}
      <div className="quote-enquiry-content">
        <header className="quote-enquiry-heading"><Dialog.Title asChild><h1 ref={heading} tabIndex={-1}>{welcome ? <>Switch to solar<br/><em>with Samerika.</em></> : 'Get Free Quote'}</h1></Dialog.Title><Dialog.Description>{welcome ? 'Book a free consultation and explore solar for your rooftop.' : 'Take the first step towards lower electricity bills with solar.'}</Dialog.Description></header>
        <EnquiryForm {...defaults} consultation={welcome} onDone={close}/>
      </div>
    </Dialog.Content>
  </Dialog.Root>;
}
