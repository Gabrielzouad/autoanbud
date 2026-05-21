import { eq } from "drizzle-orm";
import { db, buyerRequests, requestAssignments } from "../src/db";
import { assignDealersToRequest } from "../src/lib/services/requestAssignments";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "Missing DATABASE_URL. Export it before running the script, for example: DATABASE_URL=... npx tsx scripts/backfill-request-assignments.ts",
    );
    process.exit(1);
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
