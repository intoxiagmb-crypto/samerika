import test from 'node:test';
import assert from 'node:assert/strict';
import { APPLICATION_STEPS, trackingSteps, updateApplicationTracking } from '../lib/application-tracking.mjs';
const clock = new Date('2026-11-22T12:00:00Z');
const actor = { name: 'Sales staff' };
const update = (current, input) => updateApplicationTracking(current, input, actor, clock);
const complete = (current, stepId, eventDate = '2026-11-20') => update(current, { stepId, status: 'Completed', eventDate, reference: 'ACK-123' });

test('tracking starts pending and requires confirmed stages in order', () => {
  assert.equal(trackingSteps().length, 10);
  assert.ok(trackingSteps().every(step => step.status === 'Pending' && !step.eventDate));
  assert.throws(() => complete({}, 'inspection'), /earlier tracking stages/);
  assert.throws(() => update({}, { stepId: 'registration', status: 'Completed', eventDate: '2026-11-20' }), /reference or completion note/);
  let tracking = update({}, { applicationNumber: '  APP-TEST-123  ' });
  assert.equal(tracking.applicationNumber, 'APP-TEST-123');
  for (const step of APPLICATION_STEPS) tracking = complete(tracking, step.id);
  assert.equal(trackingSteps(tracking).filter(step => step.status === 'Completed').length, 10);
  assert.equal(tracking.steps.inspection.updatedBy, actor.name);
  assert.throws(() => update(tracking, { stepId: 'installation', status: 'Pending' }), /Reset later stages/);
  tracking = update(tracking, { stepId: 'subsidy_disbursal', status: 'Pending', eventDate: '2026-11-20' });
  assert.equal(tracking.steps.subsidy_disbursal.eventDate, '');
});
test('tracking rejects impossible, future and out-of-order dates and invalid stages', () => {
  for (const eventDate of ['', '2026-02-30', '2026-11-23', 'garbage']) assert.throws(() => complete({}, 'registration', eventDate));
  assert.throws(() => complete({}, 'invented-stage'));
  assert.throws(() => update({}, { stepId: 'registration', status: 'Approved' }));
  const original = complete({}, 'registration');
  const tracking = complete(original, 'application', '2026-11-21');
  assert.equal(original.steps.application, undefined, 'Updates must not mutate the existing snapshot');
  assert.throws(() => complete(tracking, 'feasibility', '2026-11-19'), /earlier than/);
  assert.throws(() => complete(tracking, 'registration', '2026-11-22'), /later than/);
  assert.throws(() => update({}, {}), /Choose a tracking update/);
});
