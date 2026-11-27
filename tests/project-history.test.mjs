import test from 'node:test';
import assert from 'node:assert/strict';
import { projectTimelineHistory } from '../lib/project-history.mjs';

test('shared history retains notes and references from both current and retired workflows',()=>{
 const site={status:'Completed',eventDate:'2026-01-01',updatedBy:'Sales',reference:'SURVEY-1',note:'Roof checked'};
 const old={status:'Completed',updatedAt:'2026-01-02T10:00:00Z',reference:'OLD-DCR'};
 const phase={name:'DCR',status:'Processing',at:'2026-01-03T10:00:00Z',updatedBy:'Manager',evidence:'Current DCR work'};
 const project={id:'P1',data:{tracking:{workflowVersion:2,steps:{site_survey:{...site,history:[site]},dcr_registration:old},legacySteps:{application:{...old,reference:'LEGACY-APP'}}},phases:[phase],documentation:{history:[{status:'Processing',updatedBy:'Reviewer',at:'2026-01-04T10:00:00Z'}]},subsidy:{status:'Processing',note:'Subsidy submitted',at:'2026-01-05T10:00:00Z'}}};
 const records=[{id:'A1',project_id:'P1',kind:'approval',data:{name:'Bank approval',history:[{status:'Approved',reference:'BANK-1',at:'2026-01-06T10:00:00Z'}]}},{id:'OTHER',project_id:'P2',kind:'approval',data:{name:'Private approval',history:[old]}}];
 const original=structuredClone(project);
 const groups=projectTimelineHistory(project,records);
 assert.deepEqual(groups.find(group=>group.id==='tracking-site_survey').entries,[site]);
 assert.equal(groups.find(group=>group.id==='tracking-dcr_registration').archived,true);
 assert.equal(groups.find(group=>group.id==='legacy-application').entries[0].reference,'LEGACY-APP');
 assert.equal(groups.find(group=>group.id==='phase-0').label,'DCR Registration');
 assert.equal(groups.find(group=>group.id==='phase-0').entries[0].evidence,'Current DCR work');
 assert.equal(groups.find(group=>group.id==='A1').entries[0].reference,'BANK-1');
 assert.equal(groups.find(group=>group.id==='subsidy').entries[0].note,'Subsidy submitted');
 assert.equal(groups.some(group=>group.id==='OTHER'),false);assert.deepEqual(project,original);
});
