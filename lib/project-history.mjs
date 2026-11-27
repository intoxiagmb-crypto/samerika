import { trackingSteps, legacyTrackingSteps } from './application-tracking.mjs';
import { installationPhaseLabel } from './project-progress.mjs';

export function projectTimelineHistory(project, records=[]) {
 const data=project.data||{},groups=[];
 const add=(id,label,saved,archived=false)=>{
  if(!saved)return;
  const entries=saved.history?.length?saved.history:(saved.updatedAt||saved.at||saved.eventDate?[saved]:[]);
  if(entries.length)groups.push({id,label,archived,entries});
 };
 if(data.tracking?.workflowVersion===2)for(const [index,step] of trackingSteps(data.tracking).entries())add(`tracking-${step.id}`,step.label,data.tracking.steps?.[step.id],index>=4);
 for(const step of legacyTrackingSteps(data.tracking))add(`legacy-${step.id}`,step.label,step,true);
 add('documentation','Documentation',data.documentation);
 for(const record of records.filter(record=>record.project_id===project.id&&record.kind==='approval'))add(record.id,record.data.name,record.data);
 for(const [index,phase] of (data.phases||[]).entries())add(`phase-${index}`,installationPhaseLabel(phase.name),phase,phase.name==='Quality inspection');
 add('subsidy','Subsidy',data.subsidy);
 return groups;
}
