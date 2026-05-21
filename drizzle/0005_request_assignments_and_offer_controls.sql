-- Create assignment_status enum
CREATE TYPE "assignment_status" AS ENUM('pending', 'assigned', 'failed', 'escalated');--> statement-breakpoint

-- Add fields to buyer_requests
ALTER TABLE "buyer_requests" ADD COLUMN "quality_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "buyer_requests" ADD COLUMN "assignment_status" "assignment_status" NOT NULL DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "buyer_requests" ADD COLUMN "offer_cap" integer DEFAULT 4;--> statement-breakpoint
ALTER TABLE "buyer_requests" ADD COLUMN "active_offer_count" integer DEFAULT 0;--> statement-breakpoint

-- Create request_assignments table
CREATE TABLE "request_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"dealership_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" varchar(32) DEFAULT 'assigned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "request_assignments_request_id_dealership_id_unique" UNIQUE("request_id","dealership_id"),
	FOREIGN KEY ("request_id") REFERENCES "buyer_requests"("id") ON DELETE cascade,
	FOREIGN KEY ("dealership_id") REFERENCES "dealerships"("id") ON DELETE cascade
);--> statement-breakpoint

-- Add indexes for performance
CREATE INDEX "idx_request_assignments_request_id" ON "request_assignments" ("request_id");--> statement-breakpoint
CREATE INDEX "idx_request_assignments_dealership_id" ON "request_assignments" ("dealership_id");--> statement-breakpoint
CREATE INDEX "idx_buyer_requests_status" ON "buyer_requests" ("status");--> statement-breakpoint
CREATE INDEX "idx_buyer_requests_assignment_status" ON "buyer_requests" ("assignment_status");--> statement-breakpoint
CREATE INDEX "idx_offers_request_id_status" ON "offers" ("request_id", "status");
