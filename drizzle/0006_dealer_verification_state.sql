-- Add dealer verification state fields
CREATE TYPE "verification_state" AS ENUM('draft', 'pending', 'verified', 'rejected');--> statement-breakpoint

ALTER TABLE "dealerships" ADD COLUMN "verification_state" "verification_state" NOT NULL DEFAULT 'draft';--> statement-breakpoint
ALTER TABLE "dealerships" ADD COLUMN "verification_notes" text NOT NULL DEFAULT '';--> statement-breakpoint
ALTER TABLE "dealerships" ADD COLUMN "verified_at" timestamptz;--> statement-breakpoint

CREATE INDEX "idx_dealerships_verification_state" ON "dealerships" ("verification_state");
