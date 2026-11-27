-- Relabel previously returned customers without changing fresh enquiries or follow-ups.
UPDATE leads
SET status='Project Back',updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now'),version=version+1
WHERE status='New'
  AND EXISTS (SELECT 1 FROM projects WHERE projects.lead_id=leads.id AND json_extract(projects.data,'$.deletedAt') IS NOT NULL)
  AND NOT EXISTS (SELECT 1 FROM projects WHERE projects.lead_id=leads.id AND json_extract(projects.data,'$.deletedAt') IS NULL);
