CREATE TABLE `d_load_forecast` (
    `id` integer PRIMARY KEY NOT NULL,
    `date` text NOT NULL,
    `time` text NOT NULL,
    `load_fcst` text NOT NULL,
    `revision` text
);
--> statement-breakpoint
CREATE TABLE `j_load_forecast` (
    `id` integer PRIMARY KEY NOT NULL,
    `date` text NOT NULL,
    `time` text NOT NULL,
    `load_fcst` text NOT NULL,
    `revision` text
);
--> statement-breakpoint