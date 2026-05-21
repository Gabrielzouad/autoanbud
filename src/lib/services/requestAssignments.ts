// src/lib/services/requestAssignments.ts
import { db, buyerRequests, requestAssignments, dealerships, dealerCapabilities } from "@/db";
import { eq, and, or, count, desc } from "drizzle-orm";
import { getMatchingBuyerRequestsForDealer, calculateMatchScore } from "@/lib/algorithms/carMatching";
import { trackEvent, trackBuyerEvent, MarketplaceEvents } from "@/lib/analytics";

export interface RequestAssignment {
  id: string;
  requestId: string;
  dealershipId: string;
  assignedAt: Date;
  isActive: boolean;
  status: string;
}

/**
 * Calculate quality score for a buyer request based on completeness and specificity.
 * Higher score = better quality lead.
 * Score ranges from 0-100.
 */
export function calculateRequestQualityScore(request: any): number {
  let score = 0;
  const maxScore = 100;

  // Make/Model specificity (20 points)
  if (request.make && request.make.length > 0) {
    score += 10;
    if (request.model && request.model.length > 0) {
      score += 10;
    }
  }

  // Budget specified (15 points)
  if (request.budgetMin || request.budgetMax) {
    score += 15;
  }

  // Year range specified (15 points)
  if (request.yearFrom || request.yearTo) {
    score += 15;
  }

  // Location specified (15 points)
  if (request.locationCity || (request.locationLat && request.locationLng)) {
    score += 15;
  }

  // Fuel type specified (10 points)
  if (request.fuelType) {
    score += 10;
  }

  // Gearbox specified (5 points)
  if (request.gearbox) {
    score += 5;
  }

  // Body type specified (5 points)
  if (request.bodyType) {
    score += 5;
  }

  // Description/details (5 points)
  if (request.description && request.description.length > 20) {
    score += 5;
  }

  // Mileage specified (5 points)
  if (request.maxKm || request.minKm) {
    score += 5;
  }

  return Math.min(score, maxScore);
}

/**
 * Assign the best matching dealers to a buyer request.
 * By default, assigns the top 3-5 dealers based on match score.
 */
export async function assignDealersToRequest(
  requestId: string,
  limit: number = 4,
): Promise<RequestAssignment[]> {
  // Get the request
  const [request] = await db
    .select()
    .from(buyerRequests)
    .where(eq(buyerRequests.id, requestId));

  if (!request) {
    throw new Error(`Request not found: ${requestId}`);
  }

  // Get all verified or pending dealers with capabilities
  const dealersWithCapabilities = await db
    .select({
      dealership: dealerships,
      capabilities: dealerCapabilities,
    })
    .from(dealerships)
    .leftJoin(dealerCapabilities, eq(dealerships.id, dealerCapabilities.dealershipId))
    .where(
      or(
        eq(dealerships.verificationState, "pending"),
        eq(dealerships.verificationState, "verified"),
      ),
    )
    .orderBy(desc(dealerships.createdAt));

  if (dealersWithCapabilities.length === 0) {
    // Update request status to failed
    await db
      .update(buyerRequests)
      .set({ assignmentStatus: "failed" })
      .where(eq(buyerRequests.id, requestId));

    return [];
  }

  // Score and rank dealers
  const dealerScores = dealersWithCapabilities
    .filter(({ capabilities }) => capabilities !== null)
    .map(({ dealership, capabilities }) => {
      const dealerCapability = {
        dealershipId: dealership.id,
        makes: capabilities?.makes || [],
        models: capabilities?.models || [],
        minYear: capabilities?.minYear || 1990,
        maxYear: capabilities?.maxYear || new Date().getFullYear() + 1,
        maxKm: capabilities?.maxKm || 500000,
        fuelTypes: capabilities?.fuelTypes || [],
        gearboxTypes: capabilities?.gearboxTypes || [],
        bodyTypes: capabilities?.bodyTypes || [],
        maxPrice: capabilities?.maxPrice || 10000000,
        serviceRadius: capabilities?.serviceRadius || 100,
        location:
          capabilities?.location &&
          typeof capabilities.location === "object" &&
          "lat" in capabilities.location
            ? (capabilities.location as { lat: number; lng: number; city: string })
            : null,
      };

      // Skip dealers without location
      if (!dealerCapability.location) {
        return null;
      }

      const matchScore = calculateMatchScore(request, dealerCapability as any);
      return {
        dealership,
        matchScore,
      };
    })
    .filter((item) => item !== null && item.matchScore.score > 0)
    .sort((a, b) => (b?.matchScore.score || 0) - (a?.matchScore.score || 0))
    .slice(0, limit) as Array<{
    dealership: any;
    matchScore: any;
  }>;

  // Check for existing assignments
  const existingAssignments = await db
    .select()
    .from(requestAssignments)
    .where(eq(requestAssignments.requestId, requestId));

  // Create new assignments
  const newAssignments: RequestAssignment[] = [];

  for (const { dealership } of dealerScores) {
    const existing = existingAssignments.find((a) => a.dealershipId === dealership.id);

    if (!existing) {
      const [assignment] = await db
        .insert(requestAssignments)
        .values({
          requestId,
          dealershipId: dealership.id,
          status: "assigned",
          isActive: true,
        })
        .returning();

      if (assignment) {
        newAssignments.push({
          id: assignment.id,
          requestId: assignment.requestId,
          dealershipId: assignment.dealershipId,
          assignedAt: assignment.assignedAt,
          isActive: assignment.isActive,
          status: assignment.status,
        });
      }
    }
  }

  // Update request assignment status
  if (newAssignments.length > 0) {
    await db
      .update(buyerRequests)
      .set({
        assignmentStatus: "assigned",
        qualityScore: calculateRequestQualityScore(request),
      })
      .where(eq(buyerRequests.id, requestId));

    // Track assignment event
    trackEvent(MarketplaceEvents.MATCHING_ASSIGNMENTS_GENERATED, {
      requestId,
      buyerId: request.buyerId,
      dealerCount: newAssignments.length,
      qualityScore: calculateRequestQualityScore(request),
    });

    // Track individual dealer assignments
    newAssignments.forEach((assignment) => {
      trackEvent(MarketplaceEvents.DEALER_REQUEST_ASSIGNED, {
        requestId,
        dealershipId: assignment.dealershipId,
      });
    });
  } else if (existingAssignments.length === 0) {
    // No matches and no existing assignments
    await db
      .update(buyerRequests)
      .set({ assignmentStatus: "failed" })
      .where(eq(buyerRequests.id, requestId));

    trackEvent(MarketplaceEvents.MATCHING_NO_DEALERS_FOUND, {
      requestId,
      buyerId: request.buyerId,
    });
  }

  return newAssignments;
}

/**
 * Get all assigned requests for a dealer.
 */
export async function getAssignedRequestsForDealer(
  dealershipId: string,
  limit: number = 50,
  onlyActive: boolean = true,
): Promise<
  Array<{
    request: any;
    assignment: RequestAssignment;
  }>
> {
  const whereCondition = onlyActive
    ? and(
        eq(requestAssignments.dealershipId, dealershipId),
        eq(requestAssignments.isActive, true),
        eq(buyerRequests.status, "open"),
      )
    : eq(requestAssignments.dealershipId, dealershipId);

  const [capabilityRow] = await db
    .select()
    .from(dealerCapabilities)
    .where(eq(dealerCapabilities.dealershipId, dealershipId))
    .limit(1);

  const dealerCapability = capabilityRow
    ? {
        dealershipId: capabilityRow.dealershipId,
        makes: capabilityRow.makes || [],
        models: capabilityRow.models || [],
        minYear: capabilityRow.minYear || 1990,
        maxYear: capabilityRow.maxYear || new Date().getFullYear() + 1,
        maxKm: capabilityRow.maxKm || 500000,
        fuelTypes: capabilityRow.fuelTypes || [],
        gearboxTypes: capabilityRow.gearboxTypes || [],
        bodyTypes: capabilityRow.bodyTypes || [],
        maxPrice: capabilityRow.maxPrice || 10000000,
        serviceRadius: capabilityRow.serviceRadius || 100,
        location:
          capabilityRow.location && typeof capabilityRow.location === "object" &&
          "lat" in capabilityRow.location
            ? (capabilityRow.location as { lat: number; lng: number; city: string })
            : null,
      }
    : null;

  const results = await db
    .select({
      request: buyerRequests,
      assignment: requestAssignments,
    })
    .from(requestAssignments)
    .innerJoin(buyerRequests, eq(requestAssignments.requestId, buyerRequests.id))
    .where(whereCondition)
    .orderBy(desc(requestAssignments.assignedAt))
    .limit(limit);

  const filteredResults = results.filter((row) => {
    if (!dealerCapability || !dealerCapability.location) {
      return true;
    }

    const match = calculateMatchScore(row.request, dealerCapability);
    return match.score > 0;
  });

  return filteredResults.map((row) => ({
    request: row.request,
    assignment: {
      id: row.assignment.id,
      requestId: row.assignment.requestId,
      dealershipId: row.assignment.dealershipId,
      assignedAt: row.assignment.assignedAt,
      isActive: row.assignment.isActive,
      status: row.assignment.status,
    },
  }));
}

/**
 * Get active assignments for a request (for offer cap enforcement).
 */
export async function getActiveAssignmentsForRequest(requestId: string): Promise<RequestAssignment[]> {
  const results = await db
    .select()
    .from(requestAssignments)
    .where(
      and(eq(requestAssignments.requestId, requestId), eq(requestAssignments.isActive, true)),
    );

  return results.map((row) => ({
    id: row.id,
    requestId: row.requestId,
    dealershipId: row.dealershipId,
    assignedAt: row.assignedAt,
    isActive: row.isActive,
    status: row.status,
  }));
}

/**
 * Check if a dealership is assigned to a request.
 */
export async function isDealershipAssignedToRequest(
  requestId: string,
  dealershipId: string,
): Promise<boolean> {
  const [result] = await db
    .select({ id: requestAssignments.id })
    .from(requestAssignments)
    .where(
      and(
        eq(requestAssignments.requestId, requestId),
        eq(requestAssignments.dealershipId, dealershipId),
        eq(requestAssignments.isActive, true),
      ),
    );

  return !!result;
}

/**
 * Get count of active offers for a request.
 */
export async function getActiveOfferCount(requestId: string): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(require("@/db").offers)
    .where(
      and(
        eq(require("@/db").offers.requestId, requestId),
        eq(require("@/db").offers.status, "submitted"),
      ),
    );

  return result[0]?.count || 0;
}

/**
 * Deactivate an assignment (when a dealer declines, cancels, etc).
 */
export async function deactivateAssignment(assignmentId: string): Promise<void> {
  await db
    .update(requestAssignments)
    .set({ isActive: false })
    .where(eq(requestAssignments.id, assignmentId));
}

/**
 * Update request offer count and persist to DB.
 */
export async function updateRequestOfferCount(requestId: string, count: number): Promise<void> {
  await db
    .update(buyerRequests)
    .set({ activeOfferCount: count })
    .where(eq(buyerRequests.id, requestId));
}
