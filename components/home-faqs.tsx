'use client';

import { useState } from 'react';
import { Minus, Plus, Sun } from 'lucide-react';

export default function HomeFaqs({ items }: { items: string[][] }) {
  const [open, setOpen] = useState<number | null>(0);
  return <div className="sh-answers-list" aria-label="Frequently asked questions">
    {items.map(([question, answer], index) => <article key={question} className={`sh-answer ${open === index ? 'is-open' : ''}`}>
      <h3><button type="button" aria-expanded={open === index} aria-controls={`home-faq-${index}`} id={`home-faq-button-${index}`} onClick={() => setOpen(open === index ? null : index)}>
        <span className="sh-answer-number" aria-hidden="true">0{index + 1}</span><span className="sh-answer-question">{question}</span>
        <span className="sh-answer-toggle" aria-hidden="true">{open === index ? <Minus size={17}/> : <Plus size={17}/>}</span>
      </button></h3>
      <div className="sh-answer-content" id={`home-faq-${index}`} role="region" aria-labelledby={`home-faq-button-${index}`} hidden={open !== index}><p>{answer}</p></div>
    </article>)}
    <p className="sh-answers-signoff"><Sun size={15}/> A clearer next step starts with the right information.</p>
  </div>;
}
