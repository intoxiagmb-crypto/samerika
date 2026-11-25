'use client';

import { useRef, useState } from 'react';
import { Check, Pencil, MapPin, Sun, FileCheck2, Info, RefreshCw, PauseCircle } from 'lucide-react';
import { trackingSteps, legacyTrackingSteps } from '@/lib/application-tracking.mjs';

type Row = Record<string, any>;
type Props = {
  projects: Row[]; role: string; selectedId: string; onSelect: (id: string) => void;
  onEditStep: (project: Row, step: Row) => void; onEditApplication: (project: Row) => void;
  onDetails: (project: Row) => void; onRefresh: () => Promise<unknown>;
};
const date = (value?: string) => value ? new Date(value.length === 10 ? `${value}T00:00:00Z` : value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : 'Not recorded';
const stamp = (value: string) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const tone = (status: string) => status === 'Completed' ? 'done' : status === 'In Progress' ? 'active' : status === 'Hold / Rejected' ? 'held' : 'pending';

export default function ApplicationTracker({ projects, role, selectedId, onSelect, onEditStep, onEditApplication, onDetails, onRefresh }: Props) {
  const detailRef = useRef<HTMLDivElement>(null);
  const [stepId, setStepId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const project = projects.find(item => item.id === selectedId) || projects[0];
  if (!project) return <section className="tracking-empty"><FileCheck2 size={32}/><h2>Your solar journey starts here.</h2><p>Once an enquiry becomes a project, your team can track its nine milestones here.</p></section>;
  const tracking = project.data.tracking || {};
  const steps = trackingSteps(tracking);
  const legacy = legacyTrackingSteps(tracking);
  const completed = steps.filter((step: Row) => step.status === 'Completed').length;
  const current = steps.find((step: Row) => step.status !== 'Completed');
  const selected = steps.find((step: Row) => step.id === stepId) || current || steps[steps.length - 1];
  const selectedIndex = steps.findIndex((step: Row) => step.id === selected.id);
  const editable = ['ADMIN', 'SALES', 'MANAGER'].includes(role) && project.status !== 'Cancelled';
  const unlocked = steps.slice(0, selectedIndex).every((step: Row) => step.status === 'Completed');
  async function refresh() { setRefreshing(true); try { await onRefresh(); } finally { setRefreshing(false); } }
  function chooseStep(id: string) {
    setStepId(id);
    if (window.matchMedia('(max-width: 900px)').matches) requestAnimationFrame(() => detailRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
  }

  return <div className="application-tracker">
    <div className="tracking-selector"><label htmlFor="tracking-project">Choose a project<select id="tracking-project" value={project.id} onChange={event => { onSelect(event.target.value); setStepId(null); }}>{projects.map(item => <option key={item.id} value={item.id}>{item.data.name} · {item.id}</option>)}</select></label><button className="button button-secondary" onClick={refresh} disabled={refreshing}><RefreshCw size={16} className={refreshing ? 'spin' : ''}/>{refreshing ? 'Refreshing…' : 'Refresh'}</button></div>
    <section className="tracking-summary">
      <div className="tracking-summary-copy"><span className="tracking-eyebrow"><Sun size={16}/> YOUR SOLAR JOURNEY</span><h2>{project.data.name}</h2><p><MapPin size={16}/>{project.data.city || 'Location to be confirmed'}<span>·</span>{project.data.capacity} kW {project.data.system}</p><div className="tracking-application"><span>Application number</span><strong>{tracking.applicationNumber || 'Not added yet'}</strong>{editable && <button aria-label="Edit application number" onClick={() => onEditApplication(project)}><Pencil size={16}/></button>}</div><span className="tracking-project-id">Project {project.id}</span></div>
      <div className="tracking-summary-progress"><div className="tracking-progress-top"><span>Workflow progress</span><strong>{completed}<small> / {steps.length}</small></strong></div><div className="tracking-progress-bar" role="progressbar" aria-label="Completed workflow stages" aria-valuenow={completed} aria-valuemin={0} aria-valuemax={steps.length}><span style={{ width: `${completed / steps.length * 100}%` }}/></div><p>{project.status === 'Cancelled' ? 'Project cancelled · tracking is read-only' : current ? `${current.status === 'Hold / Rejected' ? 'On hold' : 'Next milestone'}: ${current.label}` : 'All nine milestones completed'}</p><button onClick={() => onDetails(project)}>View project details</button></div>
    </section>

    <section className="tracking-journey" aria-labelledby="journey-title">
      <div className="tracking-section-heading"><div><span className="eyebrow">FROM SITE SURVEY TO SUBSIDY</span><h3 id="journey-title">Solar Project Workflow</h3><p>Nine steps. One clear record of your project.</p></div><div className="tracking-legend"><span><i className="completed"/>Completed</span><span><i className="in-progress"/>In Progress</span><span><i/>Pending</span><span><i className="held"/>Hold / Rejected</span></div></div>
      <div className="tracking-workflow-layout">
        <div className="tracking-scroll"><ol className="tracking-steps">{steps.map((step: Row, index: number) => <li key={step.id} className={`is-${tone(step.status)} ${selected.id === step.id ? 'is-selected' : ''}`}>
          <button onClick={() => chooseStep(step.id)} aria-pressed={selected.id === step.id} aria-label={`Step ${index + 1}: ${step.label}, ${step.status}`}>
            <span className="tracking-step-icon">{step.status === 'Completed' ? <Check size={21}/> : step.status === 'Hold / Rejected' ? <PauseCircle size={21}/> : index + 1}</span>
            <span className="tracking-step-copy"><strong>{step.label}</strong><span lang="hi" className="tracking-hindi">{step.hindi}</span><span className="tracking-step-meta"><time dateTime={step.eventDate || undefined}>{step.eventDate ? date(step.eventDate) : 'Awaiting update'}</time>{step.updatedBy && <span> · {step.updatedBy}</span>}</span></span>
            <span className={`tracking-status ${tone(step.status)}`}>{step.status}</span>
          </button>
        </li>)}</ol>{completed === steps.length && <div className="tracking-completed" role="status"><Check size={22}/><div><strong>Project Completed</strong><span>All nine workflow steps recorded as completed.</span></div></div>}</div>

        <div ref={detailRef} className="tracking-stage-detail" aria-live="polite">
          <div className="tracking-detail-title"><span className="tracking-detail-icon"><FileCheck2 size={24}/></span><div><span className="eyebrow">STEP {String(selectedIndex + 1).padStart(2, '0')} OF 09</span><h4>{selected.label}</h4></div></div>
          <span className={`tracking-status ${tone(selected.status)}`}>{selected.status}</span>
          <p lang="hi" className="tracking-detail-hindi">{selected.hindi}</p><p>{selected.hint}</p>
          <dl className="tracking-metadata"><div><dt>Status date</dt><dd>{date(selected.eventDate)}</dd></div><div><dt>Updated by</dt><dd>{selected.updatedBy || 'No update yet'}</dd></div><div><dt>Recorded at · IST</dt><dd>{selected.updatedAt ? stamp(selected.updatedAt) : 'Not recorded'}</dd></div></dl>
          <div className="tracking-evidence"><p><b>Reference</b><span>{selected.reference || 'Not added yet'}</span></p><p><b>Comment</b><span>{selected.note || 'No comment recorded.'}</span></p></div>
          {editable && <div className="tracking-detail-actions"><button className="button button-glow" disabled={!unlocked} onClick={() => onEditStep(project, selected)}><Pencil size={16}/>Update stage</button>{!unlocked && <p>Complete the earlier stages before updating this step.</p>}</div>}
          {selected.history?.length > 0 && <details className="tracking-history" key={`${project.id}-${selected.id}`}><summary>Update history ({selected.history.length})</summary><ol>{[...selected.history].reverse().map((entry: Row, index: number) => <li key={`${entry.updatedAt}-${index}`}><div><span className={`tracking-status ${tone(entry.status)}`}>{entry.status}</span><time>{date(entry.eventDate)}</time></div><strong>{entry.updatedBy}</strong><small>{stamp(entry.updatedAt)} IST</small>{entry.reference && <p>Reference: {entry.reference}</p>}{entry.note && <p>{entry.note}</p>}</li>)}</ol></details>}
        </div>
      </div>
    </section>
    {legacy.length > 0 && <details className="tracking-legacy"><summary>Earlier application records ({legacy.length})</summary><p>Previous application updates are preserved here. The new nine-step workflow is recorded separately.</p><div>{legacy.map((step: Row) => <article key={step.id}><h4>{step.label}</h4><span className={`tracking-status ${tone(step.status)}`}>{step.status}</span><p>{date(step.eventDate)} · {step.updatedBy || 'Employee not recorded'}</p>{step.updatedAt && <small>Recorded {stamp(step.updatedAt)} IST</small>}{step.reference && <p>Reference: {step.reference}</p>}{step.note && <p>{step.note}</p>}</article>)}</div></details>}
    <aside className="tracking-note"><Info size={21}/><div><strong>Updates from your company team</strong><p>Each update saves the status date, employee and comment. Subsidy Received should be completed only after receipt is confirmed. Installation checks and payment records remain available in the project details.</p></div></aside>
  </div>;
}
