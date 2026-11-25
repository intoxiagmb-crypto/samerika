'use client';

import {useCallback, useEffect, useRef, useState} from 'react';
import {House} from 'lucide-react';

const total = 500;
const duration = 1800;

export default function SolarHomesCounter() {
  const [count, setCount] = useState(0);
  const card = useRef<HTMLElement>(null);
  const frame = useRef<number | null>(null);

  const animate = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(total);
      return;
    }
    setCount(0);
    let started: number | undefined;
    const tick = (time: number) => {
      started ??= time;
      const progress = Math.min((time - started) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(progress === 1 ? total : Math.floor(total * eased));
      frame.current = progress < 1 ? requestAnimationFrame(tick) : null;
    };
    frame.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => {
      if (!motion.matches) return;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
      setCount(total);
    };
    motion.addEventListener('change', updateMotion);
    const observer = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        animate();
        observer?.disconnect();
      }
    }, {threshold: 0.35}) : null;
    if (observer && card.current) observer.observe(card.current);
    else animate();
    return () => {
      observer?.disconnect();
      motion.removeEventListener('change', updateMotion);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [animate]);

  return <article ref={card} className="sh-highlight-card sh-highlight-count" tabIndex={0}
    onPointerEnter={event => { if (event.pointerType !== 'touch') animate(); }}
    onPointerDown={event => { if (event.pointerType === 'touch') animate(); }}
    onFocus={animate}>
    <House size={32} strokeWidth={1.8} aria-hidden="true"/>
    <h3 aria-label="500 plus"><span className="sh-count-value" aria-hidden="true">{count}</span><span aria-hidden="true">+</span></h3>
    <p>Homes Solarized</p>
  </article>;
}
