'use client';

import { useState } from 'react';
import { Check, Upload } from 'lucide-react';
import { trackingSteps } from '@/lib/application-tracking.mjs';

// The portal snapshot contains versioned JSON records shared with the business service.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type Props = {
  project: Row; records: Row[]; requiredDocuments: string[]; role: string;
  saving: boolean; error: string;
  onUpdate: (action: string, values: Row, message?: string) => Promise<unknown>;
  onUpload: (file: File, documentType: string) => Promise<void>;
};
const statuses = ['Pending', 'Processing', 'Completed'];
const displayStatus = (status: string) => status === 'In Progress' ? 'Processing' : status;

export default function ProjectTimeline({ project, records, requiredDocuments, role, saving, error, onUpdate, onUpload }: Props) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const steps = trackingSteps(project.data.tracking);
  const live = !['Completed', 'Cancelled'].includes(project.status);
  const manage = ['ADMIN', 'MANAGER'].includes(role);
  const tracking = ['ADMIN', 'MANAGER', 'SALES'].includes(role);
  const technical = ['ADMIN', 'MANAGER', 'TECHNICAL'].includes(role);
  const reviewer = ['ADMIN', 'VERIFIER'].includes(role);
  const upload = ['ADMIN', 'MANAGER', 'TECHNICAL', 'VERIFIER', 'FINANCE', 'CUSTOMER', 'PARTNER'].includes(role);
  const projectRecords = records.filter(record => record.project_id === project.id);
  const extra = { id: project.id, version: project.version };
  const draft = (id: string, saved = '') => notes[id] ?? saved;
  const input = (id: string, label: string, saved = '') => <input aria-label={label} placeholder={label} value={draft(id, saved)} disabled={saving || !live} onChange={event => setNotes(current => ({ ...current, [id]: event.target.value }))}/>;
  function selector(label: string, status: string, editable: boolean, change: (value: string) => void, blocked = false, choices = statuses) {
    return editable && live ? <select aria-label={`${label} status`} value={displayStatus(status)} disabled={saving || blocked} onChange={event => change(event.target.value)}>
      {![...choices, 'Approved'].includes(displayStatus(status)) && <option value={displayStatus(status)}>{status}</option>}
      {choices.map(value => <option key={value} value={value}>{value}</option>)}
    </select> : <span className="project-step-status">{displayStatus(status)}</span>;
  }
  function row(id: string, label: string, status: string, control: React.ReactNode, content?: React.ReactNode, hint?: string) {
    return <li className={`project-step ${status === 'Completed' ? 'is-done' : ''}`} key={id}>
      <span className="project-step-dot">{status === 'Completed' ? <Check size={15}/> : <span/>}</span>
      <div className="project-step-body"><div className="project-step-heading"><strong>{label}</strong>{control}</div>{hint && <small>{hint}</small>}{content}</div>
    </li>;
  }
  function milestone(step: Row, index: number) {
    const unlocked = steps.slice(0, index).every((item: Row) => item.status === 'Completed');
    return row(step.id, step.label, step.status,
      selector(step.label, step.status, tracking, status => { void onUpdate('project.tracking', { ...extra, quick: true, stepId: step.id, status: status === 'Processing' ? 'In Progress' : status, note: draft(step.id, step.note || ''), reference: step.reference || '' }, `${step.label}: ${status}`); }, !unlocked),
      tracking && live && <details className="project-step-notes"><summary>Notes / reference</summary>{input(step.id, `${step.label} note`, step.note || '')}{step.reference && <small>{step.reference}</small>}</details>,
      !unlocked && tracking && live ? 'Complete earlier tracking steps first.' : step.updatedBy ? `Updated by ${step.updatedBy} · ${step.eventDate}` : undefined);
  }
  const documents = requiredDocuments.map(name => {
    const document = projectRecords.find(record => record.kind === 'document' && record.data.documentType === name);
    const status = !document || document.status === 'Pending' ? 'Pending' : document.status === 'Verified' ? 'Completed' : document.status === 'Under Review' ? 'Processing' : document.status === 'Submitted' ? 'Pending' : document.status;
    return row(`document-${name}`, name, status,
      selector(name, status, reviewer && !!document, value => { void onUpdate('record.update', { id: document!.id, version: document!.version, status: value === 'Completed' ? 'Verified' : value === 'Processing' ? 'Under Review' : 'Pending' }, `${name}: ${value}`); }),
      <div className="project-step-files">{document && role !== 'PARTNER' && <a href={`/api/files?id=${encodeURIComponent(document.id)}`}>{document.data.name}</a>}{document && role === 'PARTNER' && <span>{document.data.name}</span>}{upload && live && <label className="project-upload"><Upload size={14}/>{document ? 'Replace document' : 'Upload document'}<input aria-label={`Upload ${name}`} type="file" accept="application/pdf,image/jpeg,image/png" disabled={saving} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void onUpload(file, name); }}/></label>}</div>,
      document ? document.status === 'Submitted' ? 'Uploaded · ready to review and complete' : `Document: ${document.status}` : 'Upload PDF, JPEG or PNG · up to 4 MB');
  });
  const approvalNames = Array.from(new Set([...(project.data.requiredApprovals || []), ...(project.data.finance === 'Cash' ? ['Bank approval'] : [])]));
  const approvals = approvalNames.map((name: string) => {
    const approval = projectRecords.find(record => record.kind === 'approval' && record.data.name === name);
    const cash = name === 'Bank approval' && project.data.finance === 'Cash';
    const status = cash ? 'Cash' : !approval || approval.status === 'Submitted' ? 'Pending' : approval.status === 'Approved' ? 'Completed' : approval.status;
    return row(`approval-${name}`, name, status,
      selector(name, status, manage, value => { void onUpdate('project.approval', { ...extra, name, status: value === 'Completed' ? 'Approved' : value === 'Pending' ? 'Submitted' : value === 'Cash' ? 'Cash' : 'Processing', reference: draft(`approval-${name}`, approval?.data.reference || '') }, `${name}: ${value}`); }, false, name === 'Bank approval' ? [...statuses, 'Cash'] : statuses),
      cash ? <small>Cash payment · bank approval is not required.</small> : manage && live ? input(`approval-${name}`, `${name} reference (required to complete)`, approval?.data.reference || '') : approval?.data.reference && <small>{approval.data.reference}</small>);
  });
  const phases = project.data.phases.map((phase: Row, index: number) => {
    const name = phase.name === 'Meter & grid connection' ? 'Net Metering' : phase.name === 'Testing & commissioning' ? 'DCR' : phase.name;
    const unlocked = project.data.phases.slice(0, index).every((item: Row) => item.status === 'Completed');
    const editable = index >= 6 ? manage : technical;
    return row(`phase-${index}`, name, phase.status,
      selector(name, phase.status, editable, status => { void onUpdate('project.update', { ...extra, phase: index, phaseStatus: status, evidence: draft(`phase-${index}`, phase.evidence || '') }, `${name}: ${status}`); }, !unlocked),
      editable && live && (index >= 6 ? input(`phase-${index}`, index === 6 ? 'Inspection findings (required to complete)' : 'Customer acknowledgement (required to complete)', phase.evidence || '') : <details className="project-step-notes"><summary>Notes / evidence (optional)</summary>{input(`phase-${index}`, `${name} evidence`, phase.evidence || '')}</details>),
      !unlocked && editable && live ? 'Complete the previous installation phase first.' : phase.updatedBy ? `Updated by ${phase.updatedBy}` : undefined);
  });
  return <section className="project-timeline" aria-labelledby="project-timeline-title" aria-busy={saving}>
    <h3 id="project-timeline-title">Installation timeline</h3><p>हर लाइन पर status बदलें — बदलाव अपने आप save होगा।</p>
    <div className="project-timeline-feedback" role={error ? 'alert' : 'status'}>{error || (saving ? 'Saving…' : 'Pending → Processing → Completed')}</div>
    <ol>{steps.slice(0, 3).map(milestone)}{documents}{milestone(steps[3], 3)}{approvals}{phases}{steps.slice(4).map((step: Row, index: number) => milestone(step, index + 4))}</ol>
    {manage && live && <button className="button button-secondary" disabled={saving} onClick={() => { void onUpdate('project.update', { ...extra, status: 'Completed' }, 'Project completed'); }}>Complete project</button>}
  </section>;
}
