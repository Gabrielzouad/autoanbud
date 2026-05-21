#!/usr/bin/env -S npx tsx
import { db, dealerCapabilities, dealerships, requestAssignments, buyerRequests } from '../src/db';
import { eq, and } from 'drizzle-orm';
import { calculateMatchScore, getMatchingBuyerRequestsForDealer } from '../src/lib/algorithms/carMatching';

async function main() {
  console.log('Starting assignment verification...');

  const caps = await db
    .select({ cap: dealerCapabilities, dealer: dealerships })
    .from(dealerships)
    .leftJoin(dealerCapabilities, eq(dealerships.id, dealerCapabilities.dealershipId));

  const volvoCaps = caps.filter((r) => {
    const cap = (r as any).cap;
    if (!cap) return false;
    const makes: string[] = cap.makes || [];
    return makes.map((m) => m.toLowerCase()).includes('volvo');
  });

  if (volvoCaps.length === 0) {
    console.log('No dealerships with Volvo in `dealer_capabilities.makes` found.');
    return;
  }

  for (const row of volvoCaps) {
    const dealer = (row as any).dealer;
    const cap = (row as any).cap;
    console.log('\n---');
    console.log(`Dealership: ${dealer.name} (${dealer.id})`);

    const dealerObj = {
      dealershipId: cap.dealershipId,
      makes: cap.makes || [],
      models: cap.models || [],
      minYear: cap.minYear || 1990,
      maxYear: cap.maxYear || new Date().getFullYear() + 1,
      maxKm: cap.maxKm || 500000,
      fuelTypes: cap.fuelTypes || [],
      gearboxTypes: cap.gearboxTypes || [],
      bodyTypes: cap.bodyTypes || [],
      maxPrice: cap.maxPrice || 10000000,
      serviceRadius: cap.serviceRadius || 100,
      location: cap.location && typeof cap.location === 'object' && 'lat' in cap.location ? cap.location : null,
    };

    const assignments = await db
      .select()
      .from(requestAssignments)
      .where(and(eq(requestAssignments.dealershipId, dealer.id), eq(requestAssignments.isActive, true)));

    console.log(`Active assignments: ${assignments.length}`);

    for (const a of assignments) {
      const [req] = await db
        .select()
        .from(buyerRequests)
        .where(eq(buyerRequests.id, (a as any).requestId))
        .limit(1);

      if (!req) continue;
      const match = calculateMatchScore(req, dealerObj as any);
      console.log(`- Assigned request ${req.id} (${req.make} ${req.model}) -> match score ${match.score}`);
    }

    const matches = await getMatchingBuyerRequestsForDealer(dealer.id, 50);
    console.log(`Currently matching open requests: ${matches.length}`);
    for (const m of matches.slice(0, 10)) {
      console.log(`  * ${m.requestId} => score ${m.score}`);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Verification script error:', err);
    process.exit(2);
  });
