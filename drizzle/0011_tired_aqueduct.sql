ALTER TABLE "offers" ADD COLUMN "inspection_included" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "completeness_score" integer DEFAULT 0 NOT NULL;