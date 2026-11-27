import { trackingSteps } from './application-tracking.mjs';
import { requiredProjectDocuments, documentationStatus } from './documentation.mjs';

export function installationPhaseLabel(name) {
 if(name==='Meter & grid connection')return 'Net Metering';
 if(['Testing & commissioning','DCR'].includes(name))return 'DCR Registration';
 return name;
}
const state=status=>status==='In Progress'||status==='Under Review'?'Processing':status==='Approved'||status==='Verified'?'Completed':status==='Submitted'?'Pending':status||'Pending';
const done=step=>['Completed','Cash'].includes(step.status);
const held=step=>['Hold / Rejected','Rejected','Correction Required','Failed'].includes(step.status);

// Match the visible project timeline, including its consolidated documentation step.
export function projectTimelineSteps(project, records=[], requiredDocuments=[]) {
 const data=project.data||{};
 const related=records.filter(record=>record.project_id===project.id);
 const tracking=trackingSteps(data.tracking);
 const milestone=(step,group)=>({id:step.id,label:step.label,status:state(step.status),group});
 const steps=[...tracking.slice(0,3).map((step,index)=>milestone(step,index===0?'Survey':'Quotation')),
  {id:'documentation',label:'Documentation',status:documentationStatus(requiredProjectDocuments(requiredDocuments,related),data.documentation),group:'Documentation'},
  milestone(tracking[3],'Documentation')];
 const approvals=[...new Set([...(data.requiredApprovals||[]),...(data.finance==='Cash'?['Bank approval']:[])])];
 for(const name of approvals){
  const approval=related.find(record=>record.kind==='approval'&&record.data.name===name);
  steps.push({id:`approval-${name}`,label:name,status:name==='Bank approval'&&data.finance==='Cash'?'Cash':state(approval?.status),group:'Approvals'});
 }
 for(const [index,phase] of (data.phases||[]).entries()){
  if(phase.name==='Quality inspection')continue;
  const handover=phase.name==='Customer handover';
  if(handover)steps.push({id:'subsidy',label:'Subsidy',status:state(data.subsidy?.status),group:'Subsidy'});
  steps.push({id:`phase-${index}`,label:installationPhaseLabel(phase.name),status:state(phase.status),group:handover?'Handover':'Installation'});
 }
 return steps;
}
export function projectProgress(project, records=[], requiredDocuments=[]) {
 const steps=projectTimelineSteps(project,records,requiredDocuments);
 const completed=steps.filter(done).length,total=steps.length;
 let current;
 // Preserve explicit lifecycle decisions; tracking never silently completes a project.
 if(['Completed','Cancelled','On Hold','Delayed'].includes(project.status))current={id:'project',label:project.status,status:project.status,group:project.status};
 else current=steps.find(held)||steps.find(step=>step.status==='Processing')||steps.find(step=>!done(step))||{id:'ready',label:'Ready to complete',status:'Pending',group:'Handover'};
 return {...current,text:current.label===current.status?current.label:`${current.label} · ${current.status}`,completed,total,percent:total?Math.round(completed/total*100):0};
}
