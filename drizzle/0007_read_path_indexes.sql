CREATE INDEX `notifications_user_created_idx` ON `notifications` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `projects_lead_history_idx` ON `projects` (`lead_id`);