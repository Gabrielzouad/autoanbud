CREATE TABLE "dealer_capabilities" (
	"dealership_id" uuid PRIMARY KEY NOT NULL,
	"makes" text[],
	"models" text[],
	"min_year" integer DEFAULT 1990,
	"max_year" integer DEFAULT 2030,
	"max_km" integer DEFAULT 500000,
	"fuel_types" text[],
	"gearbox_types" text[],
	"body_types" text[],
	"max_price" integer DEFAULT 10000000,
	"service_radius" integer DEFAULT 100,
	"location" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "buyer_requests" ADD COLUMN "location_lat" double precision;--> statement-breakpoint
ALTER TABLE "buyer_requests" ADD COLUMN "location_lng" double precision;--> statement-breakpoint
ALTER TABLE "dealer_capabilities" ADD CONSTRAINT "dealer_capabilities_dealership_id_dealerships_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."dealerships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "buyer_requests" DROP COLUMN "location_city";--> statement-breakpoint
ALTER TABLE "buyer_requests" DROP COLUMN "location_postal_code";--> statement-breakpoint
ALTER TABLE "buyer_requests" DROP COLUMN "search_radius_km";