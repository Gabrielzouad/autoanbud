CREATE TYPE "public"."verification_state" AS ENUM('draft', 'pending', 'verified', 'rejected');--> statement-breakpoint
ALTER TABLE "dealerships" ADD COLUMN "verification_state" "verification_state" DEFAULT 'draft' NOT NULL;--> statement-breakpoint
ALTER TABLE "dealerships" ADD COLUMN "verification_notes" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "dealerships" ADD COLUMN "verified_at" timestamp with time zone;