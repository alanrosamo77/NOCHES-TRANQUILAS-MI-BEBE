CREATE TABLE `userCredentials` (
	`id` varchar(64) NOT NULL,
	`userId` varchar(64) NOT NULL,
	`username` varchar(100) NOT NULL,
	`password` varchar(255) NOT NULL,
	`createdAt` timestamp DEFAULT (now()),
	CONSTRAINT `userCredentials_id` PRIMARY KEY(`id`),
	CONSTRAINT `userCredentials_userId_unique` UNIQUE(`userId`),
	CONSTRAINT `userCredentials_username_unique` UNIQUE(`username`)
);
