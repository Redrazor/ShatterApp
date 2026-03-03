CREATE TABLE `character_tags` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`character_id` integer NOT NULL,
	`tag` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `characters` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`character_type` text DEFAULT '' NOT NULL,
	`unit_type` text DEFAULT 'Primary' NOT NULL,
	`unit_type_name` text,
	`pc` real,
	`sp` real,
	`durability` integer DEFAULT 0 NOT NULL,
	`stamina` integer DEFAULT 0 NOT NULL,
	`fp` integer DEFAULT 0 NOT NULL,
	`era` text DEFAULT '' NOT NULL,
	`swp` text DEFAULT '' NOT NULL,
	`swp_code` text,
	`spt` text,
	`thumbnail` text DEFAULT '' NOT NULL,
	`card_front` text DEFAULT '' NOT NULL,
	`card_back` text DEFAULT '' NOT NULL,
	`order_card` text,
	`stance1` text,
	`stance2` text,
	`model` text,
	`model_count` integer,
	`character_exclusion` text,
	`extra_cards` text,
	`release_date` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `missions` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`swp` text DEFAULT '' NOT NULL,
	`spt` text,
	`card` text DEFAULT '' NOT NULL,
	`struggle1a` text,
	`struggle1b` text,
	`struggle1c` text,
	`struggle2a` text,
	`struggle2b` text,
	`struggle2c` text,
	`struggle3a` text,
	`struggle3b` text,
	`struggle3c` text
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`image_url` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`product_id` integer NOT NULL,
	`character_name` text NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`swp` text DEFAULT '' NOT NULL,
	`number` text,
	`era` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`thumbnail` text DEFAULT '' NOT NULL,
	`main_image` text,
	`assembly_url` text DEFAULT '' NOT NULL,
	`store_link` text DEFAULT '' NOT NULL
);
