import { eq } from "drizzle-orm";

import { db, dealerRequestActions, offers, requestAssignments } from "@/db";
import {
  MarketplaceEvents,
  trackDealerEvent,
  trackMetricCount,
  trackMetricDistribution,
  trackMetricGauge,
} from "@/lib/analytics";

type DealerRequestActionType = "declined" | "bookmarked" | "interested";

export type DealerPerformanceMetrics = {
  assignedRequests: number;
  openAssignments: number;
  submittedOffers: number;
  activeOffers: number;
  acceptedOffers: number;
  rejectedOffers: number;
  completedDeals: number;
  responseRate: number;
  acceptanceRate: number;
  averageResponseMinutes: number | null;
  averageResponseHours: number | null;
  averageOfferQuality: number | null;
  averageOfferCompleteness: number | null;
  savedRequests: number;
  interestedRequests: number;
  declinedRequests: number;
  assignedLast7Days: number;
  offersLast7Days: number;
  acceptedLast7Days: number;
  previousAssigned7Days: number;
  previousOffers7Days: number;
  previousAccepted7Days: number;
};

type AssignmentMetricRow = {
  requestId: string;
  assignedAt: Date | string;
  isActive: boolean;
  status: string;
};

type OfferMetricRow = {
  requestId: string;
  status: string;
  createdAt: Date | string;
  qualityScore: number | null;
  completenessScore: number | null;
};

type RequestActionMetricRow = {
  action: DealerRequestActionType;
};

type CalculateDealerPerformanceInput = {
  assignments: AssignmentMetricRow[];
  offers: OfferMetricRow[];
  actions: RequestActionMetricRow[];
  now?: Date;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function percentage(numerator: number, denominator: number) {
  if (denominator <= 0) return 0;
  return Math.round((numerator / denominator) * 100);
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countRowsInRange<T>(
  rows: T[],
  getDate: (row: T) => Date,
  from: Date,
  to: Date,
) {
  return rows.filter((row) => {
    const time = getDate(row).getTime();
    return time >= from.getTime() && time < to.getTime();
  }).length;
}

export function calculateDealerPerformanceMetrics({
  assignments,
  offers: offerRows,
  actions,
  now = new Date(),
}: CalculateDealerPerformanceInput): DealerPerformanceMetrics {
  const assignedRequestIds = new Set(assignments.map((row) => row.requestId));
  const respondedRequestIds = new Set(offerRows.map((row) => row.requestId));
  const respondedAssignedRequests = Array.from(assignedRequestIds).filter((requestId) =>
    respondedRequestIds.has(requestId),
  ).length;

  const acceptedOffers = offerRows.filter((row) => row.status === "accepted").length;
  const rejectedOffers = offerRows.filter((row) => row.status === "rejected").length;
  const activeOffers = offerRows.filter((row) => row.status === "submitted").length;

  const firstAssignmentByRequest = new Map<string, Date>();
  for (const assignment of assignments) {
    const assignedAt = toDate(assignment.assignedAt);
    const previous = firstAssignmentByRequest.get(assignment.requestId);

    if (!previous || assignedAt.getTime() < previous.getTime()) {
      firstAssignmentByRequest.set(assignment.requestId, assignedAt);
    }
  }

  const firstOfferByRequest = new Map<string, Date>();
  for (const offer of offerRows) {
    const createdAt = toDate(offer.createdAt);
    const previous = firstOfferByRequest.get(offer.requestId);

    if (!previous || createdAt.getTime() < previous.getTime()) {
      firstOfferByRequest.set(offer.requestId, createdAt);
    }
  }

  const responseDelaysMinutes = Array.from(firstAssignmentByRequest.entries())
    .map(([requestId, assignedAt]) => {
      const firstOfferAt = firstOfferByRequest.get(requestId);
      if (!firstOfferAt || firstOfferAt.getTime() < assignedAt.getTime()) {
        return null;
      }

      return (firstOfferAt.getTime() - assignedAt.getTime()) / (1000 * 60);
    })
    .filter((minutes): minutes is number => minutes !== null);

  const averageResponseMinutesRaw = average(responseDelaysMinutes);
  const averageResponseMinutes =
    averageResponseMinutesRaw === null ? null : Math.round(averageResponseMinutesRaw);

  const qualityScores = offerRows
    .map((row) => row.qualityScore)
    .filter((score): score is number => typeof score === "number" && score > 0);
  const completenessScores = offerRows
    .map((row) => row.completenessScore)
    .filter((score): score is number => typeof score === "number" && score > 0);

  const currentPeriodStart = new Date(now.getTime() - 7 * DAY_MS);
  const previousPeriodStart = new Date(now.getTime() - 14 * DAY_MS);

  return {
    assignedRequests: assignedRequestIds.size,
    openAssignments: assignments.filter(
      (row) => row.isActive && row.status !== "declined",
    ).length,
    submittedOffers: offerRows.length,
    activeOffers,
    acceptedOffers,
    rejectedOffers,
    completedDeals: acceptedOffers,
    responseRate: percentage(respondedAssignedRequests, assignedRequestIds.size),
    acceptanceRate: percentage(acceptedOffers, offerRows.length),
    averageResponseMinutes,
    averageResponseHours:
      averageResponseMinutes === null
        ? null
        : Number((averageResponseMinutes / 60).toFixed(2)),
    averageOfferQuality:
      qualityScores.length === 0 ? null : Math.round(average(qualityScores) ?? 0),
    averageOfferCompleteness:
      completenessScores.length === 0
        ? null
        : Math.round(average(completenessScores) ?? 0),
    savedRequests: actions.filter((row) => row.action === "bookmarked").length,
    interestedRequests: actions.filter((row) => row.action === "interested").length,
    declinedRequests: actions.filter((row) => row.action === "declined").length,
    assignedLast7Days: countRowsInRange(
      assignments,
      (row) => toDate(row.assignedAt),
      currentPeriodStart,
      now,
    ),
    offersLast7Days: countRowsInRange(
      offerRows,
      (row) => toDate(row.createdAt),
      currentPeriodStart,
      now,
    ),
    acceptedLast7Days: countRowsInRange(
      offerRows.filter((row) => row.status === "accepted"),
      (row) => toDate(row.createdAt),
      currentPeriodStart,
      now,
    ),
    previousAssigned7Days: countRowsInRange(
      assignments,
      (row) => toDate(row.assignedAt),
      previousPeriodStart,
      currentPeriodStart,
    ),
    previousOffers7Days: countRowsInRange(
      offerRows,
      (row) => toDate(row.createdAt),
      previousPeriodStart,
      currentPeriodStart,
    ),
    previousAccepted7Days: countRowsInRange(
      offerRows.filter((row) => row.status === "accepted"),
      (row) => toDate(row.createdAt),
      previousPeriodStart,
      currentPeriodStart,
    ),
  };
}

export function getEmptyDealerPerformanceMetrics(now = new Date()) {
  return calculateDealerPerformanceMetrics({
    assignments: [],
    offers: [],
    actions: [],
    now,
  });
}

function recordNullableGauge(
  metricName: string,
  value: number | null,
  attributes: Record<string, string>,
) {
  if (value !== null) {
    trackMetricGauge(metricName, value, attributes);
  }
}

export function recordDealerPerformanceMetrics(
  dealershipId: string,
  metrics: DealerPerformanceMetrics,
  source: string,
) {
  const attributes = { dealershipId, source };

  trackMetricCount("dealer.performance.updated", 1, attributes);
  trackMetricGauge("dealer.performance.response_rate", metrics.responseRate, attributes);
  trackMetricGauge("dealer.performance.acceptance_rate", metrics.acceptanceRate, attributes);
  trackMetricGauge("dealer.performance.completed_deals", metrics.completedDeals, attributes);
  trackMetricGauge("dealer.performance.assigned_requests", metrics.assignedRequests, attributes);
  trackMetricGauge("dealer.performance.submitted_offers", metrics.submittedOffers, attributes);
  trackMetricGauge("dealer.performance.accepted_offers", metrics.acceptedOffers, attributes);
  trackMetricGauge("dealer.performance.rejected_offers", metrics.rejectedOffers, attributes);
  trackMetricGauge("dealer.performance.open_assignments", metrics.openAssignments, attributes);
  trackMetricGauge("dealer.performance.saved_requests", metrics.savedRequests, attributes);
  trackMetricGauge("dealer.performance.interested_requests", metrics.interestedRequests, attributes);
  trackMetricGauge("dealer.performance.declined_requests", metrics.declinedRequests, attributes);
  recordNullableGauge(
    "dealer.performance.average_response_hours",
    metrics.averageResponseHours,
    attributes,
  );
  recordNullableGauge(
    "dealer.performance.average_offer_quality",
    metrics.averageOfferQuality,
    attributes,
  );

  if (metrics.averageResponseHours !== null) {
    trackMetricDistribution(
      "dealer.performance.response_hours_distribution",
      metrics.averageResponseHours,
      attributes,
      "hour",
    );
  }

  trackDealerEvent(dealershipId, MarketplaceEvents.DEALER_PERFORMANCE_UPDATED, {
    ...metrics,
    source,
  });
}

export async function getDealerPerformanceMetrics(dealershipId: string) {
  const [assignmentRows, offerRows, actionRows] = await Promise.all([
    db
      .select({
        requestId: requestAssignments.requestId,
        assignedAt: requestAssignments.assignedAt,
        isActive: requestAssignments.isActive,
        status: requestAssignments.status,
      })
      .from(requestAssignments)
      .where(eq(requestAssignments.dealershipId, dealershipId)),
    db
      .select({
        requestId: offers.requestId,
        status: offers.status,
        createdAt: offers.createdAt,
        qualityScore: offers.qualityScore,
        completenessScore: offers.completenessScore,
      })
      .from(offers)
      .where(eq(offers.dealershipId, dealershipId)),
    db
      .select({ action: dealerRequestActions.action })
      .from(dealerRequestActions)
      .where(eq(dealerRequestActions.dealershipId, dealershipId)),
  ]);

  return calculateDealerPerformanceMetrics({
    assignments: assignmentRows,
    offers: offerRows,
    actions: actionRows,
  });
}

export async function getDealerPerformanceDashboardMetrics(
  dealershipId: string,
) {
  const startedAt = Date.now();
  let metrics: DealerPerformanceMetrics;

  try {
    metrics = await getDealerPerformanceMetrics(dealershipId);
  } catch (error) {
    console.warn("Failed to load dealer performance metrics:", error);
    metrics = getEmptyDealerPerformanceMetrics();
  }

  const loadMs = Date.now() - startedAt;

  recordDealerPerformanceMetrics(dealershipId, metrics, "dealer_dashboard_server");
  trackMetricCount("dealer.performance.dashboard_viewed", 1, {
    dealershipId,
    source: "dealer_dashboard_server",
  });
  trackMetricDistribution(
    "dealer.performance.metrics_load_ms",
    loadMs,
    { dealershipId, source: "dealer_dashboard_server" },
    "millisecond",
  );
  trackDealerEvent(dealershipId, MarketplaceEvents.DEALER_PERFORMANCE_DASHBOARD_VIEWED, {
    loadMs,
    openAssignments: metrics.openAssignments,
    responseRate: metrics.responseRate,
    acceptanceRate: metrics.acceptanceRate,
  });

  return {
    metrics,
    loadMs,
  };
}
