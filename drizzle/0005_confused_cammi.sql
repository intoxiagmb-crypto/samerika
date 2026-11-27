DROP INDEX `projects_lead_id_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `projects_lead_id_unique` ON `projects` (`lead_id`) WHERE json_extract("projects"."data", '$.deletedAt') IS NULL;
--> statement-breakpoint
-- Reopen customers whose only projects were deleted before this fix.
UPDATE leads
SET status='New',
    data=json_insert(json_set(data,'$.followUp',''),'$.activities',json('[]'),'$.activities[#]',json_object(
      'by','System','status','New','note','Previously deleted project: customer returned to Leads for a new follow-up.',
      'at',strftime('%Y-%m-%dT%H:%M:%fZ','now'))),
    updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),version=version+1
WHERE status='Converted'
  AND EXISTS (SELECT 1 FROM projects WHERE projects.lead_id=leads.id AND json_extract(projects.data,'$.deletedAt') IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM projects WHERE projects.lead_id=leads.id AND json_extract(projects.data,'$.deletedAt') IS NULL);
