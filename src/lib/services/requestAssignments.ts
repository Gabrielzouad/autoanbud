// src/lib/services/requestAssignments.ts
import { db, buyerRequests, requestAssignments, dealerCapabilities, offers } from "@/db";
import { eq, and, count, desc } from "drizzle-orm";
import {
  calculateMatchScore,
  getScoredDealerCandidatesForRequest,
  normalizeDealerLocation,
} from "@/lib/algorithms/carMatching";
import { trackEvent, MarketplaceEvents } from "@/lib/analytics";

export interface RequestAssignment {
  id: string;
  requestId: string;
  dealershipId: string;
  assignedAt: Date;
  isActive: boolean;
  status: string;
}

type BuyerRequestRow = typeof buyerRequests.$inferSelect;

type RequestQualityInput = {
  make?: string | null;
  model?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  yearFrom?: number | null;
  yearTo?: number | null;
  locationCity?: string | null;
  locationLat?: number | null;
  locationLng?: number | null;
  fuelType?: string | null;
  gearbox?: string | null;
  bodyType?: string | null;
  description?: string | null;
  maxKm?: number | null;
  minKm?: number | null;
};

/**
 * Calculate quality score for a buyer request based on completeness and specificity.
 * Higher score = better quality lead.
 * Score ranges from 0-100.
 */
export function calculateRequestQualityScore(request: RequestQualityInput): number {
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
  if (
    request.locationCity ||
    (typeof request.locationLat === "number" && typeof request.locationLng === "number")
  ) {
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
    trackEvent(MarketplaceEvents.REQUEST_ASSIGNMENT_FAILED, {
      requestId,
      reason: "request_not_found",
    });
    throw new Error(`Request not found: ${requestId}`);
  }

  trackEvent(MarketplaceEvents.MATCH_JOB_STARTED, {
    requestId,
    buyerId: request.buyerId,
    limit,
    requestType: request.requestType,
  });

  if (request.requestType === "open") {
    trackEvent(MarketplaceEvents.MATCHING_OPEN_SEARCH_USED, {
      requestId,
      buyerId: request.buyerId,
      limit,
    });
  }

  const dealerScores = (await getScoredDealerCandidatesForRequest(
    request,
    Math.max(limit * 20, 50),
  )).slice(0, limit);

  trackEvent(MarketplaceEvents.MATCH_DB_QUERY, {
    requestId,
    buyerId: request.buyerId,
    candidateCount: dealerScores.length,
    requestType: request.requestType,
  });

  if (request.requestType === "open" && dealerScores.length > 0) {
    const lowestConfidence = Math.min(
      ...dealerScores.map(({ matchScore }) => matchScore.confidence),
    );

    trackEvent(MarketplaceEvents.MATCHING_BROAD_MATCH_GENERATED, {
      requestId,
      buyerId: request.buyerId,
      candidateCount: dealerScores.length,
      lowestConfidence,
    });

    if (lowestConfidence < 50) {
      trackEvent(MarketplaceEvents.MATCHING_LOW_CONFIDENCE_MATCH, {
        requestId,
        buyerId: request.buyerId,
        lowestConfidence,
      });
    }
  }

  if (dealerScores.length === 0) {
    // Update request status to failed
    await db
      .update(buyerRequests)
      .set({ assignmentStatus: "failed" })
      .where(eq(buyerRequests.id, requestId));

    trackEvent(MarketplaceEvents.REQUEST_ASSIGNMENT_FAILED, {
      requestId,
      buyerId: request.buyerId,
      reason: "no_matching_dealers",
    });
    trackEvent(MarketplaceEvents.MATCH_JOB_COMPLETED, {
      requestId,
      buyerId: request.buyerId,
      dealerCount: 0,
      status: "failed",
      requestType: request.requestType,
    });

    return [];
  }

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
      requestType: request.requestType,
    });

    trackEvent(MarketplaceEvents.REQUEST_ASSIGNED, {
      requestId,
      buyerId: request.buyerId,
      dealerCount: newAssignments.length,
      qualityScore: calculateRequestQualityScore(request),
      requestType: request.requestType,
    });

    // Track individual dealer assignments
    newAssignments.forEach((assignment) => {
      trackEvent(MarketplaceEvents.DEALER_REQUEST_ASSIGNED, {
        requestId,
        dealershipId: assignment.dealershipId,
      });
    });
    trackEvent(MarketplaceEvents.MATCH_JOB_COMPLETED, {
      requestId,
      buyerId: request.buyerId,
      dealerCount: newAssignments.length,
      status: "assigned",
      requestType: request.requestType,
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
      requestType: request.requestType,
    });
    trackEvent(MarketplaceEvents.REQUEST_ASSIGNMENT_FAILED, {
      requestId,
      buyerId: request.buyerId,
      reason: "no_matching_dealers",
    });
    trackEvent(MarketplaceEvents.MATCH_JOB_COMPLETED, {
      requestId,
      buyerId: request.buyerId,
      dealerCount: 0,
      status: "failed",
      requestType: request.requestType,
    });
  } else {
    trackEvent(MarketplaceEvents.MATCH_JOB_COMPLETED, {
      requestId,
      buyerId: request.buyerId,
      dealerCount: 0,
      status: "already_assigned",
      requestType: request.requestType,
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
    request: BuyerRequestRow;
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
        location: normalizeDealerLocation(capabilityRow.location),
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
    .from(offers)
    .where(
      and(
        eq(offers.requestId, requestId),
        eq(offers.status, "submitted"),
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
