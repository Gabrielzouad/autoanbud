import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";

loadEnvConfig(process.cwd());

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "Missing DATABASE_URL. Add it to .env.local or export it before running this script.",
    );
    process.exit(1);
  }

  const [{ db, buyerRequests, requestAssignments }, { assignDealersToRequest }] =
    await Promise.all([
      import("../src/db"),
      import("../src/lib/services/requestAssignments"),
    ]);

  const targetRequestId = process.argv[2];

  if (targetRequestId) {
    if (!isUuid(targetRequestId)) {
      console.error(`Invalid request id: ${targetRequestId}`);
      console.error(
        "Run it like: npm run backfill:assignments -- 21475d26-77f6-411b-b880-0d6ebee3cfc7",
      );
      process.exit(1);
    }

    console.log(`Backfilling request ${targetRequestId}...`);
    const assignments = await assignDealersToRequest(targetRequestId, 4);
    console.log(`Created ${assignments.length} new assignments.`);
    return;
  }

  console.log("Looking for open buyer requests without active assignments...");

  const activeAssignmentRows = await db
    .select({ requestId: requestAssignments.requestId })
    .from(requestAssignments)
    .where(eq(requestAssignments.isActive, true));

  const assignedRequestIds = new Set(activeAssignmentRows.map((row) => row.requestId));

  const openRequests = await db
    .select({ id: buyerRequests.id })
    .from(buyerRequests)
    .where(eq(buyerRequests.status, "open"));

  const requestsToBackfill = openRequests.filter((row) => !assignedRequestIds.has(row.id));

  console.log(`Found ${requestsToBackfill.length} open requests without active assignments.`);

  let createdAssignments = 0;
  let skipped = 0;

  for (const request of requestsToBackfill) {
    try {
      console.log(`Backfilling request ${request.id}...`);
      const assignments = await assignDealersToRequest(request.id, 4);
      if (assignments.length > 0) {
        createdAssignments += assignments.length;
        console.log(`  Created ${assignments.length} assignments.`);
      } else {
        skipped += 1;
        console.log(`  No matching dealers found for request ${request.id}.`);
      }
    } catch (error) {
      skipped += 1;
      console.error(`  Failed to backfill request ${request.id}:`, error);
    }
  }

  console.log(`Backfill complete. Created ${createdAssignments} assignments across ${requestsToBackfill.length - skipped} requests.`);
  if (skipped > 0) {
    console.log(`${skipped} requests were skipped because no matching dealers were found or an error occurred.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
