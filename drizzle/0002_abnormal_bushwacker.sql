DROP INDEX `leads_email_idx`;--> statement-breakpoint
CREATE UNIQUE INDEX `leads_email_unique` ON `leads` (`customer_email`);