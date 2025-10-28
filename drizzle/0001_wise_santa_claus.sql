CREATE TABLE `adminNotifications` (
	`id` varchar(64) NOT NULL,
	`babyId` varchar(64) NOT NULL,
	`babyName` varchar(255) NOT NULL,
	`notificationType` enum('routine_finalized','account_created') NOT NULL,
	`message` text,
	`isRead` boolean DEFAULT false,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `adminNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `babies` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`birthDate` datetime,
	`ageMonths` int,
	`initialRoutine` text,
	`routineStartTime` varchar(10),
	`firstEventAt` datetime,
	`accountStatus` enum('active','suspended') NOT NULL DEFAULT 'active',
	`createdAt` timestamp DEFAULT (now()),
	`updatedAt` timestamp DEFAULT (now()),
	CONSTRAINT `babies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `dailySummaries` (
	`id` varchar(64) NOT NULL,
	`babyId` varchar(64) NOT NULL,
	`dayNumber` int NOT NULL,
	`summaryDate` datetime NOT NULL,
	`totalNaps` int DEFAULT 0,
	`totalNapDuration` int DEFAULT 0,
	`longestNightSleep` int DEFAULT 0,
	`nightWakeups` int DEFAULT 0,
	`finalWakeupTime` varchar(10),
	`parentObservations` text,
	`detailedSummary` text,
	`simpleSummary` text,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `dailySummaries_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sleepEvents` (
	`id` varchar(64) NOT NULL,
	`babyId` varchar(64) NOT NULL,
	`eventType` enum('siesta_inicio','siesta_fin','noche_inicio','noche_fin','despertar','alimento','baño','cambio','llanto','juego') NOT NULL,
	`eventTime` datetime NOT NULL,
	`comments` text,
	`dayNumber` int,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `sleepEvents_id` PRIMARY KEY(`id`)
);
