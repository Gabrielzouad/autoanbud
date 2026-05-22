import { eq } from "drizzle-orm";

import { db, dealerships, offers, requestAssignments } from "@/db";
import { MarketplaceEvents, trackDealerEvent } from "@/lib/analytics";

export type DealerBadgeKey =
  | "verified"
  | "high_rating"
  | "fast_response"
  | "top_performer";

export type DealerReputationBadge = {
  key: DealerBadgeKey;
  label: string;
  description: string;
};

export type DealerReputationMetrics = {
  completedMatches: number;
  responseRate: number;
  averageResponseMinutes: number | null;
};

type DealerReputationFields = {
  verified?: boolean | null;
  verificationState?: string | null;
  ratingAverage?: number | null;
  completedMatches?: number | null;
  responseRate?: number | null;
};

function toDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function isVerifiedDealer(dealership: DealerReputationFields) {
  return dealership.verified === true || dealership.verificationState === "verified";
}

export function getDealerReputationBadges(
  dealership: DealerReputationFields,
  averageResponseMinutes?: number | null,
): DealerReputationBadge[] {
  const ratingAverage = dealership.ratingAverage ?? 0;
  const completedMatches = dealership.completedMatches ?? 0;
  const responseRate = dealership.responseRate ?? 0;
  const verified = isVerifiedDealer(dealership);

  const badges: DealerReputationBadge[] = [];

  if (verified) {
    badges.push({
      key: "verified",
      label: "Verifisert",
      description: "Forhandleren er godkjent av AutoAnbud.",
    });
  }

  if (ratingAverage >= 4.5) {
    badges.push({
      key: "high_rating",
      label: "Høy vurdering",
      description: `${ratingAverage.toFixed(1)} av 5 i snittvurdering.`,
    });
  }

  if (
    typeof averageResponseMinutes === "number" &&
    averageResponseMinutes >= 0 &&
    averageResponseMinutes < 120
  ) {
    badges.push({
      key: "fast_response",
      label: "Rask respons",
      description: "Svarer vanligvis innen 2 timer.",
    });
  }

  if (
    verified &&
    completedMatches >= 3 &&
    responseRate >= 70 &&
    (ratingAverage === 0 || ratingAverage >= 4.2)
  ) {
    badges.push({
      key: "top_performer",
      label: "Topperformer",
      description: "Sterk historikk på relevante forespørsler.",
    });
  }

  return badges;
}

export function formatDealerRating(ratingAverage?: number | null) {
  if (!ratingAverage || ratingAverage <= 0) return "Ingen vurderinger ennå";
  return `${ratingAverage.toFixed(1)} av 5`;
}

export function formatResponseMinutes(minutes?: number | null) {
  if (minutes === null || minutes === undefined || minutes < 0) {
    return "Ikke nok data";
  }
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return remainingMinutes > 0
    ? `${hours} t ${remainingMinutes} min`
    : `${hours} t`;
}

export async function calculateDealerReputationMetrics(
  dealershipId: string,
): Promise<DealerReputationMetrics> {
  const [assignmentRows, offerRows] = await Promise.all([
    db
      .select({
        requestId: requestAssignments.requestId,
        assignedAt: requestAssignments.assignedAt,
      })
      .from(requestAssignments)
      .where(eq(requestAssignments.dealershipId, dealershipId)),
    db
      .select({
        requestId: offers.requestId,
        status: offers.status,
        createdAt: offers.createdAt,
      })
      .from(offers)
      .where(eq(offers.dealershipId, dealershipId)),
  ]);

  const assignedRequestIds = new Set(assignmentRows.map((row) => row.requestId));
  const respondedRequestIds = new Set(offerRows.map((row) => row.requestId));
  const respondedAssignedCount = Array.from(assignedRequestIds).filter((requestId) =>
    respondedRequestIds.has(requestId),
  ).length;

  const responseRate =
    assignedRequestIds.size > 0
      ? Math.round((respondedAssignedCount / assignedRequestIds.size) * 100)
      : 0;

  const completedMatches = offerRows.filter((row) => row.status === "accepted").length;

  const firstOfferByRequest = new Map<string, Date>();
  for (const offer of offerRows) {
    const createdAt = toDate(offer.createdAt);
    if (!createdAt) continue;

    const previous = firstOfferByRequest.get(offer.requestId);
    if (!previous || createdAt.getTime() < previous.getTime()) {
      firstOfferByRequest.set(offer.requestId, createdAt);
    }
  }

  const firstAssignmentByRequest = new Map<string, Date>();
  for (const assignment of assignmentRows) {
    const assignedAt = toDate(assignment.assignedAt);
    if (!assignedAt) continue;

    const previous = firstAssignmentByRequest.get(assignment.requestId);
    if (!previous || assignedAt.getTime() < previous.getTime()) {
      firstAssignmentByRequest.set(assignment.requestId, assignedAt);
    }
  }

  const responseDelays = Array.from(firstAssignmentByRequest.entries())
    .map(([requestId, assignedAt]) => {
      const firstOfferAt = firstOfferByRequest.get(requestId);
      if (!firstOfferAt || firstOfferAt.getTime() < assignedAt.getTime()) {
        return null;
      }

      return Math.round((firstOfferAt.getTime() - assignedAt.getTime()) / 60_000);
    })
    .filter((minutes): minutes is number => typeof minutes === "number");

  const averageResponseMinutes =
    responseDelays.length > 0
      ? Math.round(
          responseDelays.reduce((total, minutes) => total + minutes, 0) /
            responseDelays.length,
        )
      : null;

  return {
    completedMatches,
    responseRate,
    averageResponseMinutes,
  };
}

export async function getDealerReputationSnapshot(dealershipId: string) {
  const [dealership] = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.id, dealershipId));

  if (!dealership) return null;

  const metrics = await calculateDealerReputationMetrics(dealershipId);
  const reputationSource = {
    ...dealership,
    completedMatches: metrics.completedMatches,
    responseRate: metrics.responseRate,
  };

  return {
    metrics,
    ratingAverage: dealership.ratingAverage,
    badges: getDealerReputationBadges(
      reputationSource,
      metrics.averageResponseMinutes,
    ),
  };
}

export async function updateDealerReputationMetrics(dealershipId: string) {
  const [dealership] = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.id, dealershipId));

  if (!dealership) return null;

  const metrics = await calculateDealerReputationMetrics(dealershipId);
  const beforeBadges = getDealerReputationBadges(
    dealership,
    metrics.averageResponseMinutes,
  );
  const afterSource = {
    ...dealership,
    completedMatches: metrics.completedMatches,
    responseRate: metrics.responseRate,
  };
  const afterBadges = getDealerReputationBadges(
    afterSource,
    metrics.averageResponseMinutes,
  );

  await db
    .update(dealerships)
    .set({
      completedMatches: metrics.completedMatches,
      responseRate: metrics.responseRate,
      updatedAt: new Date(),
    })
    .where(eq(dealerships.id, dealershipId));

  trackDealerEvent(dealershipId, MarketplaceEvents.DEALER_METRICS_UPDATED, {
    completedMatches: metrics.completedMatches,
    previousCompletedMatches: dealership.completedMatches,
    responseRate: metrics.responseRate,
    previousResponseRate: dealership.responseRate,
    averageResponseMinutes: metrics.averageResponseMinutes,
  });

  const previousBadgeKeys = new Set(beforeBadges.map((badge) => badge.key));
  for (const badge of afterBadges) {
    if (!previousBadgeKeys.has(badge.key)) {
      trackDealerEvent(dealershipId, MarketplaceEvents.DEALER_BADGE_AWARDED, {
        badge: badge.key,
        label: badge.label,
        completedMatches: metrics.completedMatches,
        responseRate: metrics.responseRate,
        ratingAverage: dealership.ratingAverage,
      });
    }
  }

  return {
    metrics,
    ratingAverage: dealership.ratingAverage,
    badges: afterBadges,
  };
}
