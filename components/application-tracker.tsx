'use client';

import { useState } from 'react';
import { MapPin, Sun, FileCheck2, RefreshCw } from 'lucide-react';
import ProjectTimeline from './project-timeline';
import { projectProgress } from '@/lib/project-progress.mjs';

// The shared portal snapshot contains versioned business records.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type Props = {
  projects: Row[]; records: Row[]; requiredDocuments: string[]; role: string;
  selectedId: string; onSelect: (id: string) => void; saving: boolean;
  onDetails: (project: Row) => void; onRefresh: () => Promise<unknown>;
};

export default function ApplicationTracker({ projects, records, requiredDocuments, role, selectedId, onSelect, saving, onDetails, onRefresh }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const project = projects.find(item => item.id === selectedId) || projects[0];
  if (!project) return <section className="tracking-empty"><FileCheck2 size={32}/><h2>Your solar journey starts here.</h2><p>Once an enquiry becomes a project, its installation timeline will appear here.</p></section>;
  const progress = projectProgress(project, records, requiredDocuments);
  async function refresh() { setRefreshing(true); try { await onRefresh(); } finally { setRefreshing(false); } }

  return <div className="application-tracker">
    <div className="tracking-selector"><label htmlFor="tracking-project">Choose a project<select id="tracking-project" value={project.id} disabled={saving || refreshing} onChange={event => onSelect(event.target.value)}>{projects.map(item => <option key={item.id} value={item.id}>{item.data.name} · {item.id}</option>)}</select></label><button className="button button-secondary" onClick={refresh} disabled={refreshing || saving}><RefreshCw size={16} className={refreshing ? 'spin' : ''}/>{refreshing ? 'Refreshing…' : 'Refresh'}</button></div>
    <section className="tracking-summary">
      <div className="tracking-summary-copy"><span className="tracking-eyebrow"><Sun size={16}/> YOUR SOLAR JOURNEY</span><h2>{project.data.name}</h2><p><MapPin size={16}/>{project.data.city || 'Location to be confirmed'}<span>·</span>{project.data.capacity} kW {project.data.system}</p><div className="tracking-application"><span>Application number</span><strong>{project.data.tracking?.applicationNumber || 'Not added yet'}</strong></div><div className="tracking-application"><span>Customer bill no.</span><strong>{project.data.customerBillNumber || 'Not added yet'}</strong></div><span className="tracking-project-id">Project {project.id}</span></div>
      <div className="tracking-summary-progress"><div className="tracking-progress-top"><span>Timeline progress</span><strong>{progress.completed}<small> / {progress.total}</small></strong></div><div className="tracking-progress-bar" role="progressbar" aria-label="Completed timeline steps" aria-valuenow={progress.completed} aria-valuemin={0} aria-valuemax={progress.total}><span style={{ width: `${progress.percent}%` }}/></div><p>{progress.text}</p><button disabled={saving} onClick={() => onDetails(project)}>View project details</button></div>
    </section>
    <div className="tracking-shared-timeline"><ProjectTimeline key={project.id} project={project} records={records} requiredDocuments={requiredDocuments} role={role} readOnly/></div>
  </div>;
}
