CREATE TYPE "public"."assignment_status" AS ENUM('pending', 'assigned', 'failed', 'escalated');--> statement-breakpoint
CREATE TABLE "request_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"dealership_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"status" varchar(32) DEFAULT 'assigned' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buyer_requests" ADD COLUMN "quality_score" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "buyer_requests" ADD COLUMN "assignment_status" "assignment_status" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "buyer_requests" ADD COLUMN "offer_cap" integer DEFAULT 4;--> statement-breakpoint
ALTER TABLE "buyer_requests" ADD COLUMN "active_offer_count" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_request_id_buyer_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."buyer_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "request_assignments" ADD CONSTRAINT "request_assignments_dealership_id_dealerships_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."dealerships"("id") ON DELETE cascade ON UPDATE no action;