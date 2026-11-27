import test from 'node:test';
import assert from 'node:assert/strict';
import { APPLICATION_STEPS, TRACKING_STATUSES, trackingSteps, legacyTrackingSteps, updateApplicationTracking } from '../lib/application-tracking.mjs';
const clock = new Date('2026-11-22T12:00:00Z');
const actor = { id: 'sales-1', name: 'Sales staff', role: 'SALES' };
const update = (current, input) => updateApplicationTracking(current, input, actor, clock);
const complete = (current, stepId, eventDate = '2026-11-20') => update(current, { stepId, status: 'Completed', eventDate, reference: 'ACK-123' });

test('nine-step workflow completes in order and cannot reopen an earlier completed stage', () => {
  assert.deepEqual(APPLICATION_STEPS.map(s => s.label), ['Site Survey', 'Quotation', 'Order Confirmation', 'Customer Registration', 'Installation', 'DCR Registration', 'Net Metering', 'Subsidy Application', 'Subsidy Received']);
  assert.ok(trackingSteps().every(step => step.status === 'Pending' && !step.eventDate));
  assert.throws(() => complete({}, 'net_metering'), /earlier tracking stages/);
  assert.throws(() => update({}, { stepId: 'site_survey', status: 'Completed', eventDate: '2026-11-20' }), /reference or completion note/);
  let tracking = update({}, { applicationNumber: '  APP-TEST-123  ' });
  assert.equal(tracking.applicationNumber, 'APP-TEST-123');
  for (const step of APPLICATION_STEPS) tracking = complete(tracking, step.id);
  assert.equal(trackingSteps(tracking).filter(step => step.status === 'Completed').length, 9);
  assert.equal(tracking.steps.net_metering.updatedBy, actor.name);
  assert.throws(() => update(tracking, { stepId: 'installation', status: 'Pending', eventDate: '2026-11-21' }), /Reset later stages/);
  tracking = update(tracking, { stepId: 'subsidy_disbursal', status: 'Pending', eventDate: '2026-11-21', note: 'Receipt requires rechecking' });
  assert.equal(tracking.steps.subsidy_disbursal.eventDate, '2026-11-21');
  assert.equal(tracking.steps.subsidy_disbursal.history.length, 2);
  assert.equal(trackingSteps(tracking).filter(step => step.status === 'Completed').length, 8);
});
test('all statuses require valid dates and chronological completed stages', () => {
  for (const status of TRACKING_STATUSES) {
    for (const eventDate of ['', '2026-02-30', '2026-11-23', 'garbage']) assert.throws(() => update({}, { stepId: 'site_survey', status, eventDate, note: 'Recorded' }));
  }
  assert.throws(() => complete({}, 'invented-stage'));
  assert.throws(() => update({}, { stepId: 'site_survey', status: 'Approved' }));
  const original = complete({}, 'site_survey');
  const tracking = complete(original, 'quotation', '2026-11-21');
  assert.equal(original.steps.quotation, undefined, 'Updates must not mutate the existing snapshot');
  assert.throws(() => complete(tracking, 'order_confirmation', '2026-11-19'), /earlier than/);
  assert.throws(() => complete(tracking, 'site_survey', '2026-11-22'), /later than/);
  assert.throws(() => update({}, {}), /Choose a tracking update/);
});
test('hold/rejection requires a reason, blocks progress, and retains every employee update', () => {
  assert.throws(() => update({}, { stepId: 'site_survey', status: 'Hold / Rejected', eventDate: '2026-11-20' }), /comment explaining/);
  const held = update({}, { stepId: 'site_survey', status: 'Hold / Rejected', eventDate: '2026-11-20', note: 'Roof access unavailable', updatedBy: 'Forged employee', updatedById: 'forged' });
  assert.equal(held.steps.site_survey.updatedById, actor.id);
  assert.equal(held.steps.site_survey.updatedBy, actor.name);
  assert.equal(held.steps.site_survey.updatedByRole, actor.role);
  assert.throws(() => complete(held, 'quotation'), /earlier tracking stages/);
  const resumed = update(held, { stepId: 'site_survey', status: 'In Progress', eventDate: '2026-11-21', note: 'Visit rescheduled' });
  const finished = complete(resumed, 'site_survey', '2026-11-22');
  assert.deepEqual(finished.steps.site_survey.history.map(h => h.status), ['Hold / Rejected', 'In Progress', 'Completed']);
  assert.equal(finished.steps.site_survey.history[0].note, 'Roof access unavailable');
  assert.equal(held.steps.site_survey.history.length, 1);
  assert.equal(resumed.steps.site_survey.history.length, 2);
});
test('legacy application records remain intact without implying new workflow completion', () => {
  const old = { applicationNumber: 'EXISTING-001', steps: { registration: { status: 'Completed', eventDate: '2026-11-01', reference: 'OLD-REG', updatedBy: 'Former staff', note: 'Original application' }, subsidy_disbursal: { status: 'Completed', eventDate: '2026-11-10', reference: 'OLD-PAYMENT' } } };
  const before = structuredClone(old);
  assert.ok(trackingSteps(old).every(step => step.status === 'Pending'));
  assert.equal(legacyTrackingSteps(old).length, 2);
  const editedNumber = update(old, { applicationNumber: 'EXISTING-002' });
  const changed = complete(editedNumber, 'site_survey');
  assert.equal(changed.workflowVersion, 2);
  assert.deepEqual(changed.legacySteps, old.steps);
  assert.equal(legacyTrackingSteps(changed)[0].note, 'Original application');
  assert.equal(trackingSteps(changed).find(s => s.id === 'subsidy_disbursal').status, 'Pending');
  const again = complete(changed, 'quotation');
  assert.deepEqual(again.legacySteps, old.steps);
  assert.deepEqual(old, before);
});
test('status date uses the India calendar at the UTC date boundary', () => {
  const updated = updateApplicationTracking({}, { stepId: 'site_survey', status: 'In Progress', eventDate: '2026-11-23' }, actor, new Date('2026-11-22T19:00:00Z'));
  assert.equal(updated.steps.site_survey.eventDate, '2026-11-23');
});

test('shared timeline edits preserve retired application records without treating them as active prerequisites',()=>{
 let tracking={};for(const step of APPLICATION_STEPS)tracking=complete(tracking,step.id);
 const oldInstallation=structuredClone(tracking.steps.installation);
 const updated=updateApplicationTracking(tracking,{stepId:'registration',status:'Pending',eventDate:'2026-11-22'},actor,clock,true);
 assert.equal(updated.steps.registration.status,'Pending');assert.deepEqual(updated.steps.installation,oldInstallation);
 assert.deepEqual(updated.steps.subsidy_disbursal,tracking.steps.subsidy_disbursal);
 const finished=updateApplicationTracking(updated,{stepId:'registration',status:'Completed',eventDate:'2026-11-22'},actor,clock,true);
 assert.equal(finished.steps.registration.status,'Completed');
 assert.throws(()=>updateApplicationTracking(finished,{stepId:'site_survey',status:'Pending',eventDate:'2026-11-22'},actor,clock,true),/Reset later stages/);
});
