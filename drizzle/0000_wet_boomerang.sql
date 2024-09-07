CREATE TABLE `d_load_fcst` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`load_fcst` text NOT NULL,
	`revision` text
);
--> statement-breakpoint
CREATE TABLE `j_load_fcst` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`load_fcst` text NOT NULL,
	`revision` text
);
--> statement-breakpoint
CREATE TABLE `load_act` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`load_act` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `mm_load_fcst` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`load_fcst` text NOT NULL,
	`revision` text
);
--> statement-breakpoint
CREATE TABLE `mw_load_fcst` (
	`id` integer PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`time` text NOT NULL,
	`load_fcst` text NOT NULL,
	`revision` text
);
