CREATE TABLE "offer_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"offer_id" uuid NOT NULL,
	"sender_id" text NOT NULL,
	"sender_role" "user_role" NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offer_messages" ADD CONSTRAINT "offer_messages_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "offer_messages" ADD CONSTRAINT "offer_messages_sender_id_user_profiles_user_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."user_profiles"("user_id") ON DELETE cascade ON UPDATE no action;