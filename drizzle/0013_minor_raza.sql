CREATE TYPE "public"."moderation_entity_type" AS ENUM('request', 'offer', 'dealership');--> statement-breakpoint
CREATE TYPE "public"."moderation_status" AS ENUM('flagged', 'reviewing', 'resolved', 'dismissed');--> statement-breakpoint
CREATE TABLE "moderation_flags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "moderation_entity_type" NOT NULL,
	"entity_id" uuid NOT NULL,
	"reason" text NOT NULL,
	"reporter_id" text NOT NULL,
	"status" "moderation_status" DEFAULT 'flagged' NOT NULL,
	"resolution_notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "moderation_flags" ADD CONSTRAINT "moderation_flags_reporter_id_user_profiles_user_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_moderation_flags_status_created" ON "moderation_flags" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "idx_moderation_flags_entity" ON "moderation_flags" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "idx_moderation_flags_reporter" ON "moderation_flags" USING btree ("reporter_id");