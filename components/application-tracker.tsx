'use client';

import { useRef, useState } from 'react';
import { Check, Clock3, CircleDashed, ArrowUpRight, Pencil, MapPin, Sun, FileCheck2, Info, RefreshCw } from 'lucide-react';
import { trackingSteps } from '@/lib/application-tracking.mjs';

type Row = Record<string, any>;
type Props = {
  projects: Row[]; role: string; selectedId: string; onSelect: (id: string) => void;
  onEditStep: (project: Row, step: Row) => void; onEditApplication: (project: Row) => void;
  onDetails: (project: Row) => void; onRefresh: () => Promise<unknown>;
};
const date = (value?: string) => value ? new Date(value.length === 10 ? `${value}T00:00:00Z` : value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'Date not recorded';

export default function ApplicationTracker({ projects, role, selectedId, onSelect, onEditStep, onEditApplication, onDetails, onRefresh }: Props) {
  const detailRef = useRef<HTMLDivElement>(null);
  const [stepId, setStepId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const project = projects.find(item => item.id === selectedId) || projects[0];
  if (!project) return <section className="tracking-empty"><span><FileCheck2 size={32}/></span><h2>Your solar journey starts here.</h2><p>Once an enquiry becomes a project, its application tracking will appear here.</p><p>Company staff can then record the application number and each confirmed milestone.</p></section>;
  const tracking = project.data.tracking || {};
  const steps = trackingSteps(tracking);
  const completed = steps.filter((step: Row) => step.status === 'Completed').length;
  const currentIndex = steps.findIndex((step: Row) => step.status !== 'Completed');
  const current = steps[currentIndex];
  const selected = steps.find((step: Row) => step.id === stepId) || current || steps[steps.length - 1];
  const selectedIndex = steps.findIndex((step: Row) => step.id === selected.id);
  const editable = ['ADMIN', 'SALES', 'MANAGER'].includes(role) && project.status !== 'Cancelled';
  const unlocked = steps.slice(0, selectedIndex).every((step: Row) => step.status === 'Completed');
  async function refresh() { setRefreshing(true); try { await onRefresh(); } finally { setRefreshing(false); } }

  return <div className="application-tracker">
    <div className="tracking-selector"><label htmlFor="tracking-project">Choose a project<select id="tracking-project" value={project.id} onChange={event => { onSelect(event.target.value); setStepId(null); }}>{projects.map(item => <option key={item.id} value={item.id}>{item.data.name} · {item.id}</option>)}</select></label><button className="button button-secondary" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spin' : ''}/>{refreshing ? 'Refreshing…' : 'Refresh'}</button></div>

    <section className="tracking-summary">
      <div className="tracking-summary-copy"><span className="tracking-eyebrow"><Sun size={15}/> YOUR SOLAR JOURNEY</span><h2>{project.data.name}</h2><p><MapPin size={14}/>{project.data.city || 'Location to be confirmed'}<span>·</span>{project.data.capacity} kW {project.data.system}</p><div className="tracking-application"><span>Application number</span><strong>{tracking.applicationNumber || 'Not added yet'}</strong>{editable && <button aria-label="Edit application number" onClick={() => onEditApplication(project)}><Pencil size={15}/></button>}</div><span className="tracking-project-id">Project {project.id}</span></div>
      <div className="tracking-summary-progress"><div className="tracking-progress-top"><span>{completed === steps.length ? 'Journey recorded' : 'Application progress'}</span><strong>{completed}<small> / {steps.length}</small></strong></div><div className="tracking-progress-bar" role="progressbar" aria-label="Completed application stages" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={steps.length}><span style={{ width: `${completed / steps.length * 100}%` }}/></div><p>{project.status === 'Cancelled' ? 'Project cancelled · tracking is read-only' : current ? `Next milestone: ${current.label}` : 'All application milestones recorded'}</p><button onClick={() => onDetails(project)}>View installation details <ArrowUpRight size={15}/></button></div>
    </section>

    <section className="tracking-journey" aria-labelledby="journey-title">
      <div className="tracking-section-heading"><div><span className="eyebrow">FROM APPLICATION TO COMPLETION</span><h3 id="journey-title">Every step, clearly connected.</h3></div><div className="tracking-legend"><span><i className="completed"/>Completed</span><span><i className="in-progress"/>In progress</span><span><i/>Pending</span></div></div>
      <div className="tracking-scroll"><ol className="tracking-steps">{steps.map((step: Row, index: number) => {
        const done = step.status === 'Completed', active = step.status === 'In Progress';
        return <li key={step.id} className={`${done ? 'is-complete' : active ? 'is-progress' : 'is-pending'} ${selected.id === step.id ? 'is-selected' : ''}`}>
          <button onClick={() => { setStepId(step.id); if (window.matchMedia('(max-width: 700px)').matches) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })); }} aria-pressed={selected.id === step.id} aria-label={`${step.label}, ${step.status}`}>
            <span className="tracking-owner">{step.owner}</span><span className="tracking-step-icon">{done ? <Check size={19}/> : active ? <Clock3 size={19}/> : <CircleDashed size={19}/>}</span><span className="tracking-step-number">STEP {String(index + 1).padStart(2, '0')}</span><strong>{step.label}</strong><span className="tracking-status">{step.status}</span><time dateTime={step.eventDate || undefined}>{step.eventDate ? date(step.eventDate) : 'Awaiting update'}</time>
          </button>
        </li>;
      })}</ol></div>
      <div ref={detailRef} className="tracking-stage-detail" aria-live="polite"><div className="tracking-detail-title"><span className="tracking-detail-icon"><FileCheck2 size={23}/></span><div><span className="eyebrow">STEP {String(selectedIndex + 1).padStart(2, '0')} · {selected.owner}</span><h4>{selected.label}</h4></div><span className={`tracking-detail-status ${selected.status === 'Completed' ? 'done' : selected.status === 'In Progress' ? 'active' : ''}`}>{selected.status}</span></div><p>{selected.hint}</p>
        {(selected.reference || selected.note) && <div className="tracking-evidence">{selected.reference && <p><b>Reference</b><span>{selected.reference}</span></p>}{selected.note && <p><b>Progress note</b><span>{selected.note}</span></p>}</div>}
        <div className="tracking-detail-bottom"><small>{selected.updatedAt ? `Updated ${date(selected.updatedAt)}${selected.updatedBy ? ` by ${selected.updatedBy}` : ''}` : 'No update recorded for this stage.'}</small>{editable && <button className="button button-glow" disabled={!unlocked} title={!unlocked ? 'Complete earlier stages first' : undefined} onClick={() => onEditStep(project, selected)}><Pencil size={15}/>{unlocked ? 'Update stage' : 'Complete earlier stages first'}</button>}</div>
      </div>
    </section>
    <aside className="tracking-note"><Info size={20}/><div><strong>Updates from your company team</strong><p>Application and subsidy statuses are recorded manually from acknowledgements and confirmed references. A completed application step does not guarantee subsidy approval or payment.</p></div></aside>
  </div>;
}
