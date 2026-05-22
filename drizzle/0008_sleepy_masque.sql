ALTER TABLE "dealerships" ADD COLUMN "rating_average" double precision DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "dealerships" ADD COLUMN "completed_matches" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "dealerships" ADD COLUMN "response_rate" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
UPDATE "dealerships" AS d
SET "completed_matches" = accepted."completed_matches"
FROM (
  SELECT "dealership_id", count(*)::integer AS "completed_matches"
  FROM "offers"
  WHERE "status" = 'accepted'
  GROUP BY "dealership_id"
) AS accepted
WHERE d."id" = accepted."dealership_id";--> statement-breakpoint
WITH assigned AS (
  SELECT "dealership_id", count(DISTINCT "request_id")::integer AS "assigned_count"
  FROM "request_assignments"
  GROUP BY "dealership_id"
),
responded AS (
  SELECT "dealership_id", count(DISTINCT "request_id")::integer AS "responded_count"
  FROM "offers"
  GROUP BY "dealership_id"
)
UPDATE "dealerships" AS d
SET "response_rate" =
  CASE
    WHEN assigned."assigned_count" > 0
      THEN round((coalesce(responded."responded_count", 0)::numeric / assigned."assigned_count") * 100)::integer
    ELSE 0
  END
FROM assigned
LEFT JOIN responded ON responded."dealership_id" = assigned."dealership_id"
WHERE d."id" = assigned."dealership_id";
