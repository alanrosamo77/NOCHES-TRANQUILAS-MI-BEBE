ALTER TABLE `babies` MODIFY COLUMN `birthDate` timestamp;--> statement-breakpoint
ALTER TABLE `babies` MODIFY COLUMN `firstEventAt` timestamp;--> statement-breakpoint
ALTER TABLE `babies` ADD `weightKg` int;--> statement-breakpoint
ALTER TABLE `babies` ADD `heightCm` int;--> statement-breakpoint
ALTER TABLE `babies` ADD `photoUrl` varchar(512);