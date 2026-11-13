CREATE TABLE `payment_references` (
	`reference` text PRIMARY KEY NOT NULL,
	`record_id` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`record_id`) REFERENCES `records`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `payment_references_record_id_unique` ON `payment_references` (`record_id`);