import { z } from 'zod';
import { assert } from './policy.mjs';

const LEGACY_STEPS = [
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
export const APPLICATION_STEPS = [
  { id: 'site_survey', label: 'Site Survey', owner: 'Survey team', hint: 'Inspect the roof, electrical load and location; record the site photos.', hindi: 'छत की जाँच, लोड, लोकेशन और फोटो' },
  { id: 'quotation', label: 'Quotation', owner: 'Sales team', hint: 'Record the system price, quotation reference and customer consent.', hindi: 'सिस्टम की कीमत और ग्राहक की सहमति' },
  { id: 'order_confirmation', label: 'Order Confirmation', owner: 'Company team', hint: 'Confirm the advance payment and customer order.', hindi: 'एडवांस और ऑर्डर कन्फर्मेशन' },
  { id: 'registration', label: 'Customer Registration', owner: 'Company team', hint: 'Collect the customer application and required documents.', hindi: 'ग्राहक का आवेदन और दस्तावेज प्राप्त करना' },
  { id: 'installation', label: 'Installation', owner: 'Installation team', hint: 'Record the solar panel, inverter and wiring installation.', hindi: 'सोलर पैनल, इन्वर्टर और वायरिंग का काम' },
  { id: 'dcr_registration', label: 'DCR Registration', owner: 'Company team', hint: 'Record panel serial numbers and the supporting DCR documentation.', hindi: 'पैनल सीरियल नंबर और DCR से संबंधित प्रक्रिया' },
  { id: 'net_metering', label: 'Net Metering', owner: 'Company team / DISCOM', hint: 'Record the application, inspection and meter installation references.', hindi: 'आवेदन, निरीक्षण और मीटर इंस्टॉलेशन' },
  { id: 'subsidy_request', label: 'Subsidy Application', owner: 'Company team', hint: 'Record the subsidy application acknowledgement and bank verification.', hindi: 'सब्सिडी आवेदन और बैंक सत्यापन' },
  { id: 'subsidy_disbursal', label: 'Subsidy Received', owner: 'Company team', hint: 'Confirm receipt using a payment reference or verified receipt note.', hindi: 'सब्सिडी प्राप्ति की पुष्टि और भुगतान का विवरण' },
];
export const TRACKING_STATUSES = ['Pending', 'In Progress', 'Completed', 'Hold / Rejected'];
export function legacyTrackingSteps(tracking = {}) {
  const saved = tracking.workflowVersion === 2 ? tracking.legacySteps : tracking.steps;
  return LEGACY_STEPS.filter(step => saved?.[step.id]).map(step => ({ ...saved[step.id], ...step }));
}
export function trackingSteps(tracking = {}) {
  // The former application milestones have different meanings. Never infer that
  // a new business milestone is complete from a similarly named legacy stage.
  const saved = tracking.workflowVersion === 2 ? tracking.steps : {};
  return APPLICATION_STEPS.map(step => ({ status: 'Pending', ...saved?.[step.id], ...step }));
}
export function updateApplicationTracking(current = {}, input, actor, clock = new Date(), quick = false) {
  const data = z.object({
    applicationNumber: z.string().trim().max(100).optional(),
    stepId: z.enum(APPLICATION_STEPS.map(step => step.id)).optional(),
    status: z.enum(TRACKING_STATUSES).optional(),
    eventDate: z.string().max(10).optional(),
    reference: z.string().trim().max(200).default(''),
    note: z.string().trim().max(2000).default(''),
  }).parse(input);
  assert(data.applicationNumber !== undefined || data.stepId, 'Choose a tracking update.');
  const next = { ...current, workflowVersion: 2, steps: current.workflowVersion === 2 ? { ...current.steps } : {}, updatedAt: clock.toISOString() };
  if (current.workflowVersion !== 2 && Object.keys(current.steps || {}).length) next.legacySteps = { ...current.steps };
  if (data.applicationNumber !== undefined) next.applicationNumber = data.applicationNumber;
  if (!data.stepId) return next;
  assert(data.status, 'Choose the stage status.');
  const index = APPLICATION_STEPS.findIndex(step => step.id === data.stepId);
  const steps = trackingSteps(current);
  const day = data.eventDate || '';
  assert(/^\d{4}-\d{2}-\d{2}$/.test(day) && !Number.isNaN(Date.parse(day)) && new Date(day).toISOString().slice(0, 10) === day, 'Enter a valid status date.');
  const today = clock.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  assert(day <= today, 'Status dates cannot be in the future.');
  if (data.status !== 'Pending') {
    assert(steps.slice(0, index).every(step => step.status === 'Completed'), 'Complete the earlier tracking stages first.');
    assert(steps.slice(0, index).every(step => !step.eventDate || step.eventDate <= day), 'The status date cannot be earlier than a previous stage.');
    if (data.status === 'Completed' && !quick) assert(data.reference || data.note, 'Add an acknowledgement reference or completion note.');
    if (data.status === 'Hold / Rejected') assert(data.note, 'Add a comment explaining the hold or rejection.');
  }
  const later = steps.slice(index + 1).filter(step => step.status !== 'Pending');
  if (data.status !== 'Completed') assert(!later.length, 'Reset later stages to Pending before reopening this stage.');
  if (data.status === 'Completed') assert(later.every(step => !step.eventDate || step.eventDate >= data.eventDate), 'The status date cannot be later than a following stage.');
  const entry = { status: data.status, eventDate: day, reference: data.reference, note: data.note, updatedAt: clock.toISOString(), updatedBy: actor.name, updatedById: actor.id, updatedByRole: actor.role };
  const previous = next.steps[data.stepId];
  next.steps[data.stepId] = { ...entry, history: [...(previous?.history || []), entry] };
  return next;
}
