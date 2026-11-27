'use client';

import { Fragment, useState } from 'react';
import { Check, Clock3, LoaderCircle, AlertCircle, Upload } from 'lucide-react';
import { requiredProjectDocuments, documentationStatus } from '@/lib/documentation.mjs';
import { installationPhaseLabel } from '@/lib/project-progress.mjs';
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
  const [documentType, setDocumentType] = useState(requiredDocuments[0] || 'Other');
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
    const done = status === 'Completed' || status === 'Cash';
    const processing = ['Processing', 'In Progress', 'Under Review'].includes(status);
    const held = ['Hold / Rejected', 'Rejected', 'Correction Required', 'Failed'].includes(status);
    const tone = done ? 'is-done' : held ? 'is-held' : processing ? 'is-processing' : 'is-pending';
    return <li className={`project-step ${tone}`} key={id}>
      <span className="project-step-dot" aria-hidden="true">{done ? <Check size={18} strokeWidth={3}/> : held ? <AlertCircle size={18}/> : processing ? <LoaderCircle size={18}/> : <Clock3 size={17}/>}</span>
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
  const requiredUploads = requiredProjectDocuments(requiredDocuments, projectRecords);
  const documentation = documentationStatus(requiredUploads, project.data.documentation);
  const documents = row('documentation', 'Documentation', documentation,
    selector('Documentation', documentation, reviewer, status => { void onUpdate('project.documentation', { ...extra, status, documents: requiredUploads.filter(Boolean).map((document: Row) => ({ id: document.id, version: document.version })) }, `Documentation: ${status}`); }),
    <details className="project-documentation-files"><summary>Upload / view documents</summary>
      {upload && live && <div className="project-documentation-upload"><select aria-label="Documentation document type" value={documentType} disabled={saving} onChange={event => setDocumentType(event.target.value)}>{requiredDocuments.map(name => <option key={name} value={name}>{name}</option>)}</select><label className="project-upload"><Upload size={14}/>Upload document<input aria-label="Upload documentation" type="file" accept="application/pdf,image/jpeg,image/png" disabled={saving} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void onUpload(file, documentType); }}/></label></div>}
      {requiredDocuments.map((name, index) => { const document = requiredUploads[index]; return <div className="project-documentation-file" key={name}><strong>{name}</strong>{document ? <>{role !== 'PARTNER' ? <a href={`/api/files?id=${encodeURIComponent(document.id)}`}>{document.data.name}</a> : <span>{document.data.name}</span>}<small>{document.status}</small></> : <small>Not uploaded</small>}</div>; })}
      <small>PDF, JPEG or PNG · up to 4 MB per file</small>
    </details>, `${requiredUploads.filter(Boolean).length} of ${requiredDocuments.length} documents uploaded`);
  const approvalNames = Array.from(new Set([...(project.data.requiredApprovals || []), ...(project.data.finance === 'Cash' ? ['Bank approval'] : [])]));
  const approvals = approvalNames.map((name: string) => {
    const approval = projectRecords.find(record => record.kind === 'approval' && record.data.name === name);
    const cash = name === 'Bank approval' && project.data.finance === 'Cash';
    const status = cash ? 'Cash' : !approval || approval.status === 'Submitted' ? 'Pending' : approval.status === 'Approved' ? 'Completed' : approval.status;
    return row(`approval-${name}`, name, status,
      selector(name, status, manage, value => { void onUpdate('project.approval', { ...extra, name, status: value === 'Completed' ? 'Approved' : value === 'Pending' ? 'Submitted' : value === 'Cash' ? 'Cash' : 'Processing', reference: draft(`approval-${name}`, approval?.data.reference || '') }, `${name}: ${value}`); }, false, name === 'Bank approval' ? [...statuses, 'Cash'] : statuses),
      cash ? <small>Cash payment · bank approval is not required.</small> : manage && live ? input(`approval-${name}`, `${name} reference (required to complete)`, approval?.data.reference || '') : approval?.data.reference && <small>{approval.data.reference}</small>);
  });
  const subsidy = project.data.subsidy || { status: 'Pending' };
  const handoverIndex = project.data.phases.findIndex((phase: Row) => phase.name === 'Customer handover');
  const subsidyUnlocked = handoverIndex >= 0 && project.data.phases.slice(0, handoverIndex).filter((phase: Row) => phase.name !== 'Quality inspection').every((phase: Row) => phase.status === 'Completed');
  const subsidyRow = row('subsidy', 'Subsidy', subsidy.status,
    selector('Subsidy', subsidy.status, technical, status => { void onUpdate('project.update', { ...extra, subsidyStatus: status, subsidyNote: draft('subsidy', subsidy.note || '') }, `Subsidy: ${status}`); }, !subsidyUnlocked),
    technical && live && <details className="project-step-notes"><summary>Notes / reference (optional)</summary>{input('subsidy', 'Subsidy note / reference', subsidy.note || '')}</details>,
    !subsidyUnlocked && technical && live ? 'Complete the previous installation phases first.' : subsidy.updatedBy ? `Updated by ${subsidy.updatedBy}` : undefined);
  const phases = project.data.phases.map((phase: Row, index: number) => {
    if (phase.name === 'Quality inspection') return null;
    const handover = phase.name === 'Customer handover';
    const name = installationPhaseLabel(phase.name);
    const unlocked = project.data.phases.slice(0, index).filter((item: Row) => item.name !== 'Quality inspection').every((item: Row) => item.status === 'Completed');
    const editable = handover ? manage : technical;
    const phaseRow = row(`phase-${index}`, name, phase.status,
      selector(name, phase.status, editable, status => { void onUpdate('project.update', { ...extra, phase: index, phaseStatus: status, evidence: draft(`phase-${index}`, phase.evidence || '') }, `${name}: ${status}`); }, !unlocked),
      editable && live && (handover ? input(`phase-${index}`, 'Customer acknowledgement (required to complete)', phase.evidence || '') : <details className="project-step-notes"><summary>Notes / evidence (optional)</summary>{input(`phase-${index}`, `${name} evidence`, phase.evidence || '')}</details>),
      !unlocked && editable && live ? 'Complete the previous installation phase first.' : phase.updatedBy ? `Updated by ${phase.updatedBy}` : undefined);
    return handover ? <Fragment key={`phase-${index}`}>{subsidyRow}{phaseRow}</Fragment> : phaseRow;
  });
  return <section className="project-timeline" aria-labelledby="project-timeline-title" aria-busy={saving}>
    <h3 id="project-timeline-title">Installation timeline</h3><p>हर लाइन पर status बदलें — बदलाव अपने आप save होगा।</p>
    <div className="project-timeline-feedback" role={error ? 'alert' : 'status'}>{error || (saving ? 'Saving…' : 'Pending → Processing → Completed')}</div>
    <ol>{steps.slice(0, 3).map(milestone)}{documents}{milestone(steps[3], 3)}{approvals}{phases}</ol>
    {manage && live && <button className="button button-secondary" disabled={saving} onClick={() => { void onUpdate('project.update', { ...extra, status: 'Completed' }, 'Project completed'); }}>Complete project</button>}
  </section>;
}
