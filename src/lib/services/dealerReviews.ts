import { and, eq } from "drizzle-orm";

import { db, buyerRequests, dealerReviews, dealerships, offers } from "@/db";
import { MarketplaceEvents, trackBuyerEvent, trackDealerEvent } from "@/lib/analytics";
import { AppError } from "@/lib/errors";
import { trackUnauthorizedAttempt } from "@/lib/services/authorization";
import {
  calculateDealerReputationMetrics,
  getDealerReputationBadges,
  updateDealerReputationMetrics,
} from "@/lib/services/dealerReputation";

export type DealerReviewInput = {
  offerId: string;
  rating: number;
  comment?: string;
};

export async function getDealerReviewForOffer(offerId: string, buyerId: string) {
  const [review] = await db
    .select()
    .from(dealerReviews)
    .where(and(eq(dealerReviews.offerId, offerId), eq(dealerReviews.buyerId, buyerId)));

  return review ?? null;
}

async function calculateRatingAverage(dealershipId: string) {
  const reviews = await db
    .select({ rating: dealerReviews.rating })
    .from(dealerReviews)
    .where(eq(dealerReviews.dealershipId, dealershipId));

  if (reviews.length === 0) return 0;

  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return Math.round((total / reviews.length) * 10) / 10;
}

export async function createDealerReviewForBuyer(
  buyerId: string,
  data: DealerReviewInput,
) {
  if (!Number.isInteger(data.rating) || data.rating < 1 || data.rating > 5) {
    throw new AppError("Vurderingen må være mellom 1 og 5.", "VALIDATION");
  }

  const [row] = await db
    .select({
      offer: offers,
      request: buyerRequests,
      dealership: dealerships,
    })
    .from(offers)
    .innerJoin(buyerRequests, eq(offers.requestId, buyerRequests.id))
    .innerJoin(dealerships, eq(offers.dealershipId, dealerships.id))
    .where(and(eq(offers.id, data.offerId), eq(buyerRequests.buyerId, buyerId)));

  if (!row) {
    trackUnauthorizedAttempt("createDealerReviewForBuyer", {
      error: "unauthorized_offer_review",
      buyerId,
      offerId: data.offerId,
    });
    throw new AppError("Tilbudet finnes ikke", "NOT_FOUND");
  }

  if (row.offer.status !== "accepted" || row.request.acceptedOfferId !== row.offer.id) {
    throw new AppError(
      "Du kan bare vurdere forhandleren etter at tilbudet er akseptert.",
      "CONFLICT",
    );
  }

  const existingReview = await getDealerReviewForOffer(row.offer.id, buyerId);
  if (existingReview) {
    throw new AppError("Du har allerede vurdert denne forhandleren.", "CONFLICT");
  }

  const metrics = await calculateDealerReputationMetrics(row.offer.dealershipId);
  const beforeBadges = getDealerReputationBadges(
    row.dealership,
    metrics.averageResponseMinutes,
  );

  const [review] = await db
    .insert(dealerReviews)
    .values({
      offerId: row.offer.id,
      requestId: row.request.id,
      dealershipId: row.offer.dealershipId,
      buyerId,
      rating: data.rating,
      comment: data.comment?.trim() ?? "",
    })
    .returning();

  const ratingAverage = await calculateRatingAverage(row.offer.dealershipId);
  await db
    .update(dealerships)
    .set({
      ratingAverage,
      updatedAt: new Date(),
    })
    .where(eq(dealerships.id, row.offer.dealershipId));

  const reputation = await updateDealerReputationMetrics(row.offer.dealershipId);
  const previousBadgeKeys = new Set(beforeBadges.map((badge) => badge.key));
  for (const badge of reputation?.badges ?? []) {
    if (!previousBadgeKeys.has(badge.key)) {
      trackDealerEvent(row.offer.dealershipId, MarketplaceEvents.DEALER_BADGE_AWARDED, {
        badge: badge.key,
        label: badge.label,
        ratingAverage,
        reviewId: review.id,
      });
    }
  }

  trackBuyerEvent(buyerId, MarketplaceEvents.BUYER_DEALER_REVIEW_SUBMITTED, {
    reviewId: review.id,
    offerId: row.offer.id,
    requestId: row.request.id,
    dealershipId: row.offer.dealershipId,
    rating: review.rating,
  });
  trackDealerEvent(row.offer.dealershipId, MarketplaceEvents.DEALER_REVIEW_SUBMITTED, {
    reviewId: review.id,
    offerId: row.offer.id,
    requestId: row.request.id,
    rating: review.rating,
    ratingAverage,
  });

  return review;
}
