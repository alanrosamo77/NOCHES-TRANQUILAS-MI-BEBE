ALTER TABLE `sleepEvents` MODIFY COLUMN `eventTime` timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE `sleepEvents` MODIFY COLUMN `dayNumber` int NOT NULL;--> statement-breakpoint
ALTER TABLE `sleepEvents` ADD `wakeReason` varchar(100);--> statement-breakpoint
ALTER TABLE `sleepEvents` ADD `foodType` varchar(100);--> statement-breakpoint
ALTER TABLE `sleepEvents` ADD `foodAmount` varchar(50);--> statement-breakpoint
ALTER TABLE `sleepEvents` ADD `duration` int;