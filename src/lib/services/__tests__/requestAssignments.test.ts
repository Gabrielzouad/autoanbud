import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import { assignDealersToRequest } from "../requestAssignments";
import * as dbModule from "@/db";
import { getScoredDealerCandidatesForRequest } from "@/lib/algorithms/carMatching";

vi.mock("drizzle-orm", () => ({
  and: vi.fn((...conditions) => ({ type: "and", conditions })),
  count: vi.fn(() => ({ type: "count" })),
  desc: vi.fn((column) => ({ type: "desc", column })),
  eq: vi.fn((left, right) => ({ type: "eq", left, right })),
}));

vi.mock("@/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
  buyerRequests: {
    id: "buyer_requests.id",
  },
  requestAssignments: {
    id: "request_assignments.id",
    requestId: "request_assignments.request_id",
    dealershipId: "request_assignments.dealership_id",
    isActive: "request_assignments.is_active",
  },
  dealerCapabilities: {},
  offers: {},
}));

vi.mock("@/lib/algorithms/carMatching", () => ({
  calculateMatchScore: vi.fn(),
  getScoredDealerCandidatesForRequest: vi.fn(),
  normalizeDealerLocation: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  MarketplaceEvents: {
    DEALER_REQUEST_ASSIGNED: "dealer.request_assigned",
    MATCH_DB_QUERY: "match.db_query",
    MATCH_JOB_COMPLETED: "match.job_completed",
    MATCH_JOB_STARTED: "match.job_started",
    MATCHING_ASSIGNMENTS_GENERATED: "matching.assignments_generated",
    MATCHING_BROAD_MATCH_GENERATED: "matching.broad_match_generated",
    MATCHING_LOW_CONFIDENCE_MATCH: "matching.low_confidence_match",
    MATCHING_NO_DEALERS_FOUND: "matching.no_dealers_found",
    MATCHING_OPEN_SEARCH_USED: "matching.open_search_used",
    REQUEST_ASSIGNED: "request.assigned",
    REQUEST_ASSIGNMENT_FAILED: "request.assignment_failed",
  },
  trackEvent: vi.fn(),
}));

describe("requestAssignments service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fills declined assignment slots with the next matching dealer", async () => {
    const request = {
      id: "request-1",
      buyerId: "buyer-1",
      requestType: "fixed",
      make: "Volvo",
      model: "XC90",
      offerCap: 4,
    };
    const existingAssignments = ["dealer-1", "dealer-2", "dealer-3", "dealer-4"].map(
      (dealershipId) => ({
        id: `assignment-${dealershipId}`,
        requestId: request.id,
        dealershipId,
        assignedAt: new Date("2026-06-01T10:00:00.000Z"),
        isActive: dealershipId !== "dealer-4",
        status: dealershipId === "dealer-4" ? "declined" : "assigned",
      }),
    );
    const insertedAssignment = {
      id: "assignment-dealer-5",
      requestId: request.id,
      dealershipId: "dealer-5",
      assignedAt: new Date("2026-06-01T11:00:00.000Z"),
      isActive: true,
      status: "assigned",
    };
    const insertValues = vi.fn().mockReturnValue({
      returning: vi.fn().mockResolvedValue([insertedAssignment]),
    });

    (dbModule.db.select as unknown as Mock)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([request]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(existingAssignments),
        }),
      });
    (dbModule.db.insert as unknown as Mock).mockReturnValue({
      values: insertValues,
    });
    (dbModule.db.update as unknown as Mock).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue(undefined),
      }),
    });
    (getScoredDealerCandidatesForRequest as Mock).mockResolvedValue(
      ["dealer-1", "dealer-2", "dealer-3", "dealer-4", "dealer-5"].map(
        (id) => ({
          dealership: { id },
          matchScore: { score: 90, confidence: 90 },
        }),
      ),
    );

    const result = await assignDealersToRequest(request.id, 1);

    expect(result).toEqual([insertedAssignment]);
    expect(insertValues).toHaveBeenCalledWith({
      requestId: request.id,
      dealershipId: "dealer-5",
      status: "assigned",
      isActive: true,
    });
  });
});
