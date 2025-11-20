CREATE TYPE "public"."body_type" AS ENUM('suv', 'sedan', 'wagon', 'hatchback', 'coupe', 'convertible', 'van', 'pickup', 'other');--> statement-breakpoint
CREATE TYPE "public"."car_condition" AS ENUM('new', 'used', 'demo');--> statement-breakpoint
CREATE TYPE "public"."fuel_type" AS ENUM('petrol', 'diesel', 'hybrid', 'ev', 'other');--> statement-breakpoint
CREATE TYPE "public"."gearbox_type" AS ENUM('automatic', 'manual', 'any');--> statement-breakpoint
CREATE TYPE "public"."offer_status" AS ENUM('submitted', 'withdrawn', 'accepted', 'rejected', 'expired');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('open', 'under_review', 'accepted', 'expired', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('buyer', 'dealer', 'admin');--> statement-breakpoint
CREATE TABLE "buyer_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" text NOT NULL,
	"status" "request_status" DEFAULT 'open' NOT NULL,
	"title" varchar(200) NOT NULL,
	"make" varchar(100) NOT NULL,
	"model" varchar(100) NOT NULL,
	"generation" varchar(100),
	"year_from" integer,
	"year_to" integer,
	"max_km" integer,
	"min_km" integer,
	"condition" "car_condition",
	"fuel_type" "fuel_type",
	"gearbox" "gearbox_type",
	"body_type" "body_type",
	"budget_min" integer,
	"budget_max" integer,
	"currency" varchar(3) DEFAULT 'NOK' NOT NULL,
	"location_city" varchar(120),
	"location_postal_code" varchar(16),
	"search_radius_km" integer,
	"wants_trade_in" boolean DEFAULT false,
	"financing_needed" boolean,
	"description" text,
	"accepted_offer_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"meta" jsonb
);
--> statement-breakpoint
CREATE TABLE "dealer_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dealership_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" varchar(32) DEFAULT 'manager' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dealerships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" text NOT NULL,
	"name" varchar(200) NOT NULL,
	"org_number" varchar(32) NOT NULL,
	"address" text,
	"city" varchar(120),
	"postal_code" varchar(16),
	"country" varchar(2) DEFAULT 'NO' NOT NULL,
	"lat" integer,
	"lng" integer,
	"makes" text DEFAULT '',
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"dealership_id" uuid NOT NULL,
	"dealer_user_id" text NOT NULL,
	"status" "offer_status" DEFAULT 'submitted' NOT NULL,
	"car_reg_nr" varchar(32),
	"vin" varchar(64),
	"car_make" varchar(100) NOT NULL,
	"car_model" varchar(100) NOT NULL,
	"car_variant" varchar(150),
	"car_year" integer NOT NULL,
	"car_km" integer NOT NULL,
	"car_condition" "car_condition" NOT NULL,
	"fuel_type" "fuel_type",
	"gearbox" "gearbox_type",
	"body_type" "body_type",
	"color_exterior" varchar(100),
	"color_interior" varchar(100),
	"price_total" integer NOT NULL,
	"price_old" integer,
	"currency" varchar(3) DEFAULT 'NOK' NOT NULL,
	"delivery_time_estimate" varchar(200),
	"warranty_summary" varchar(200),
	"financing_possible" boolean,
	"financing_example" text,
	"location_city" varchar(120),
	"location_postal_code" varchar(16),
	"distance_km" integer,
	"short_message_to_buyer" text,
	"internal_notes" text,
	"image_urls" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"role" "user_role" DEFAULT 'buyer' NOT NULL,
	"phone" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "buyer_requests" ADD CONSTRAINT "buyer_requests_buyer_id_user_profiles_user_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_members" ADD CONSTRAINT "dealer_members_dealership_id_dealerships_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."dealerships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealer_members" ADD CONSTRAINT "dealer_members_user_id_user_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dealerships" ADD CONSTRAINT "dealerships_owner_id_user_profiles_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_request_id_buyer_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."buyer_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_dealership_id_dealerships_id_fk" FOREIGN KEY ("dealership_id") REFERENCES "public"."dealerships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_dealer_user_id_user_profiles_user_id_fk" FOREIGN KEY ("dealer_user_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_user_id_users_sync_id_fk" FOREIGN KEY ("user_id") REFERENCES "neon_auth"."users_sync"("id") ON DELETE cascade ON UPDATE no action;