import { describe, expect, it } from "vitest";

import {
  calculateDealerPerformanceMetrics,
  getEmptyDealerPerformanceMetrics,
} from "../dealerPerformance";

const now = new Date("2026-05-27T10:00:00.000Z");

describe("calculateDealerPerformanceMetrics", () => {
  it("calculates response, acceptance, offer quality, and action metrics", () => {
    const result = calculateDealerPerformanceMetrics({
      now,
      assignments: [
        {
          requestId: "req-1",
          assignedAt: new Date("2026-05-27T08:00:00.000Z"),
          isActive: true,
          status: "assigned",
        },
        {
          requestId: "req-2",
          assignedAt: new Date("2026-05-26T08:00:00.000Z"),
          isActive: true,
          status: "assigned",
        },
        {
          requestId: "req-3",
          assignedAt: new Date("2026-05-25T08:00:00.000Z"),
          isActive: false,
          status: "declined",
        },
      ],
      offers: [
        {
          requestId: "req-1",
          status: "accepted",
          createdAt: new Date("2026-05-27T09:00:00.000Z"),
          qualityScore: 90,
          completenessScore: 80,
        },
        {
          requestId: "req-2",
          status: "rejected",
          createdAt: new Date("2026-05-26T10:00:00.000Z"),
          qualityScore: 70,
          completenessScore: 60,
        },
      ],
      actions: [
        { action: "bookmarked" },
        { action: "interested" },
        { action: "declined" },
      ],
    });

    expect(result.assignedRequests).toBe(3);
    expect(result.openAssignments).toBe(2);
    expect(result.submittedOffers).toBe(2);
    expect(result.acceptedOffers).toBe(1);
    expect(result.rejectedOffers).toBe(1);
    expect(result.completedDeals).toBe(1);
    expect(result.responseRate).toBe(67);
    expect(result.acceptanceRate).toBe(50);
    expect(result.averageResponseMinutes).toBe(90);
    expect(result.averageResponseHours).toBe(1.5);
    expect(result.averageOfferQuality).toBe(80);
    expect(result.averageOfferCompleteness).toBe(70);
    expect(result.savedRequests).toBe(1);
    expect(result.interestedRequests).toBe(1);
    expect(result.declinedRequests).toBe(1);
  });

  it("returns zero/null metrics when there is no activity", () => {
    const result = calculateDealerPerformanceMetrics({
      now,
      assignments: [],
      offers: [],
      actions: [],
    });

    expect(result.responseRate).toBe(0);
    expect(result.acceptanceRate).toBe(0);
    expect(result.averageResponseMinutes).toBeNull();
    expect(result.averageResponseHours).toBeNull();
    expect(result.averageOfferQuality).toBeNull();
  });

  it("uses the same zero/null shape for dashboard fallback metrics", () => {
    expect(getEmptyDealerPerformanceMetrics(now)).toEqual(
      calculateDealerPerformanceMetrics({
        now,
        assignments: [],
        offers: [],
        actions: [],
      }),
    );
  });
});
