UPDATE "dealer_capabilities"
SET "location" = ("location" #>> '{}')::jsonb
WHERE jsonb_typeof("location") = 'string'
  AND btrim("location" #>> '{}') LIKE '{%';--> statement-breakpoint
CREATE INDEX "idx_p3_buyer_requests_status_make" ON "buyer_requests" USING btree ("status","make");--> statement-breakpoint
CREATE INDEX "idx_p3_buyer_requests_location" ON "buyer_requests" USING btree ("location_lat","location_lng");--> statement-breakpoint
CREATE INDEX "idx_p3_buyer_requests_quality_created" ON "buyer_requests" USING btree ("quality_score","created_at");--> statement-breakpoint
CREATE INDEX "idx_p3_dealer_capabilities_makes" ON "dealer_capabilities" USING gin ("makes");--> statement-breakpoint
CREATE INDEX "idx_p3_dealer_capabilities_location" ON "dealer_capabilities" USING gin ("location");--> statement-breakpoint
CREATE INDEX "idx_p3_dealerships_verification" ON "dealerships" USING btree ("verification_state","rating_average","response_rate");--> statement-breakpoint
CREATE INDEX "idx_p3_request_assignments_dealer_active" ON "request_assignments" USING btree ("dealership_id","is_active","assigned_at");--> statement-breakpoint
CREATE INDEX "idx_p3_request_assignments_request_active" ON "request_assignments" USING btree ("request_id","is_active");
