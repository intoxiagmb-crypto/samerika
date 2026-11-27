import test from 'node:test';
import assert from 'node:assert/strict';
import { projectProgress, projectTimelineSteps } from '../lib/project-progress.mjs';
import { PHASES } from '../lib/policy.mjs';
const project=()=>({id:'P1',status:'Quality inspection',data:{finance:'Finance',requiredApprovals:['Bank approval'],phases:PHASES.map(name=>({name,status:'Pending'})),tracking:{workflowVersion:2,steps:{}}}});
const docs=[{id:'D1',project_id:'P1',kind:'document',status:'Verified',created_at:'2026-01-01',data:{documentType:'Bill'}}];
function ready(){const p=project();for(const id of ['site_survey','quotation','order_confirmation','registration'])p.data.tracking.steps[id]={status:'Completed'};return p;}

test('current stage follows active tracking and advances to the next pending step',()=>{
 const p=project();assert.equal(projectProgress(p,[],['Bill']).text,'Site Survey · Pending');
 p.data.tracking.steps.site_survey={status:'In Progress'};
 assert.equal(projectProgress(p,[],['Bill']).text,'Site Survey · Processing');
 p.data.tracking.steps.site_survey.status='Completed';
 assert.equal(projectProgress(p,[],['Bill']).text,'Quotation · Pending');
 p.data.documentation={status:'Processing'};
 assert.equal(projectProgress(p,[],['Bill']).text,'Documentation · Processing');
 p.data.tracking.steps.quotation={status:'Hold / Rejected'};
 assert.equal(projectProgress(p,[],['Bill']).text,'Quotation · Hold / Rejected');
});

test('project summary uses exactly the visible phases and treats Cash as satisfied',()=>{
 const p=ready();p.data.finance='Cash';p.data.requiredApprovals=[];
 p.data.phases[4].name='Meter & grid connection';p.data.phases[5].name='DCR';
 p.data.phases.splice(6,0,{name:'Quality inspection',status:'Pending'});
 const steps=projectTimelineSteps(p,docs,['Bill']);
 assert.deepEqual(steps.map(step=>step.label),['Site Survey','Quotation','Order Confirmation','Documentation','Customer Registration','Bank approval','Site preparation','Mounting structure','Panel installation','Electrical work','Net Metering','DCR Registration','Subsidy','Customer handover']);
 assert.equal(projectProgress(p,docs,['Bill']).text,'Site preparation · Pending');
 p.data.phases.forEach(phase=>phase.status='Completed');
 p.data.subsidy={status:'Processing'};
 assert.equal(projectProgress(p,docs,['Bill']).text,'Subsidy · Processing');
 p.data.subsidy.status='Completed';
 const progress=projectProgress(p,docs,['Bill']);assert.equal(progress.label,'Ready to complete');assert.equal(progress.percent,100);assert.equal(p.status,'Quality inspection');
});

test('explicit lifecycle decisions remain visible and unrelated projects cannot influence the summary',()=>{
 const p=ready();for(const status of ['Completed','Cancelled','On Hold','Delayed']){p.status=status;assert.equal(projectProgress(p,docs,['Bill']).text,status);}
 p.status='Installation';
 const otherDocs=docs.map(document=>({...document,project_id:'OTHER'}));
 assert.equal(projectProgress(p,otherDocs,['Bill']).text,'Documentation · Pending');
 const replacement={...docs[0],id:'D2',status:'Submitted',created_at:'2026-02-01'};
 assert.equal(projectProgress(p,[...docs,replacement],['Bill']).label,'Documentation');
});
