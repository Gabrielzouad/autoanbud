CREATE TYPE "public"."dealer_request_action" AS ENUM('declined', 'bookmarked', 'interested');--> statement-breakpoint
CREATE TABLE "dealer_request_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"dealership_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"action" "dealer_request_action" NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dealer_request_actions" ADD CONSTRAINT "dealer_request_actions_request_id_buyer_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."buyer_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_request_actions" ADD CONSTRAINT "dealer_request_actions_dealership_id_dealerships_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."dealerships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_request_actions" ADD CONSTRAINT "dealer_request_actions_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dealer_request_actions_request_dealer_unique" ON "dealer_request_actions" USING btree ("request_id","dealership_id");