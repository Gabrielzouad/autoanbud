CREATE TABLE "dealer_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"request_id" uuid NOT NULL,
	"dealership_id" uuid NOT NULL,
	"buyer_id" text NOT NULL,
	"rating" integer NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dealer_reviews" ADD CONSTRAINT "dealer_reviews_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_reviews" ADD CONSTRAINT "dealer_reviews_request_id_buyer_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."buyer_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_reviews" ADD CONSTRAINT "dealer_reviews_dealership_id_dealerships_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."dealerships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_reviews" ADD CONSTRAINT "dealer_reviews_buyer_id_user_profiles_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "dealer_reviews_offer_id_unique" ON "dealer_reviews" USING btree ("offer_id");