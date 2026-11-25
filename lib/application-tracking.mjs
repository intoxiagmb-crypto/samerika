import { z } from 'zod';
import { assert } from './policy.mjs';

export const APPLICATION_STEPS = [
  { id: 'registration', label: 'Registration', owner: 'Consumer', hint: 'Record the consumer registration acknowledgement.' },
  { id: 'application', label: 'Application', owner: 'Consumer', hint: 'Record the submitted application and its acknowledgement.' },
  { id: 'feasibility', label: 'Feasibility', owner: 'DISCOM', hint: 'Record the feasibility decision received from the DISCOM.' },
  { id: 'vendor', label: 'Vendor selection', owner: 'Consumer', hint: 'Confirm the selected installation vendor.' },
  { id: 'agreement', label: 'Upload agreement', owner: 'Vendor', hint: 'Record the uploaded consumer–vendor agreement reference.' },
  { id: 'installation', label: 'Installation', owner: 'Vendor', hint: 'Record the installation completion and supporting reference.' },
  { id: 'inspection', label: 'Inspection', owner: 'DISCOM', hint: 'Record the inspection status and report received.' },
  { id: 'commissioning', label: 'Project commissioning', owner: 'DISCOM', hint: 'Record the commissioning certificate or acknowledgement.' },
  { id: 'subsidy_request', label: 'Subsidy request', owner: 'Consumer', hint: 'Record the submitted subsidy request acknowledgement, where applicable.' },
  { id: 'subsidy_disbursal', label: 'Subsidy disbursal', owner: 'Disbursing authority', hint: 'Record a confirmed disbursal reference. Submission alone does not confirm payment.' },
];
export const TRACKING_STATUSES = ['Pending', 'In Progress', 'Completed'];
export function trackingSteps(tracking = {}) {
  return APPLICATION_STEPS.map(step => ({ ...step, status: 'Pending', ...tracking.steps?.[step.id] }));
}
export function updateApplicationTracking(current = {}, input, actor, clock = new Date()) {
  const data = z.object({
    applicationNumber: z.string().trim().max(100).optional(),
    stepId: z.enum(APPLICATION_STEPS.map(step => step.id)).optional(),
    status: z.enum(TRACKING_STATUSES).optional(),
    eventDate: z.string().max(10).optional(),
    reference: z.string().trim().max(200).default(''),
    note: z.string().trim().max(2000).default(''),
  }).parse(input);
  assert(data.applicationNumber !== undefined || data.stepId, 'Choose a tracking update.');
  const next = { ...current, steps: { ...current.steps }, updatedAt: clock.toISOString() };
  if (data.applicationNumber !== undefined) next.applicationNumber = data.applicationNumber;
  if (!data.stepId) return next;
  assert(data.status, 'Choose the stage status.');
  const index = APPLICATION_STEPS.findIndex(step => step.id === data.stepId);
  const steps = trackingSteps(current);
  if (data.status !== 'Pending') {
    assert(steps.slice(0, index).every(step => step.status === 'Completed'), 'Complete the earlier tracking stages first.');
    const day = data.eventDate || '';
    assert(/^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day, 'Enter a valid status date.');
    const today = clock.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    assert(day <= today, 'Status dates cannot be in the future.');
    assert(steps.slice(0, index).every(step => !step.eventDate || step.eventDate <= day), 'The status date cannot be earlier than a previous stage.');
    if (data.status === 'Completed') assert(data.reference || data.note, 'Add an acknowledgement reference or completion note.');
  }
  const later = steps.slice(index + 1).filter(step => step.status !== 'Pending');
  if (data.status !== 'Completed') assert(!later.length, 'Reset later stages to Pending before reopening this stage.');
  if (data.status === 'Completed') assert(later.every(step => !step.eventDate || step.eventDate >= data.eventDate), 'The status date cannot be later than a following stage.');
  next.steps[data.stepId] = { status: data.status, eventDate: data.status === 'Pending' ? '' : data.eventDate, reference: data.reference, note: data.note, updatedAt: clock.toISOString(), updatedBy: actor.name };
  return next;
}
