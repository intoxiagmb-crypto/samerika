'use client';

import { useState, type ReactNode } from 'react';

export default function ProjectGallery({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState('All');
  return <div className="app-project-gallery" data-filter={filter}>
    <div className="app-project-filters" aria-label="Filter solar project types">{['All', 'Residential', 'Commercial', 'Industrial'].map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{value}</button>)}</div>
    {children}
  </div>;
}
