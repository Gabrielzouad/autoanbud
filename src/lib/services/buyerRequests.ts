// src/lib/services/buyerRequests.ts
import { db, buyerRequests, userProfiles } from "@/db";
import { eq } from "drizzle-orm";
import { CreateBuyerRequestInput } from "../validation/buyerRequest";
import { assignDealersToRequest, calculateRequestQualityScore } from "@/lib/services/requestAssignments";
import { trackBuyerEvent, trackEvent, MarketplaceEvents } from "@/lib/analytics";
import { AppError } from "@/lib/errors";
import { trackAuthFailure, trackUnauthorizedAttempt } from "@/lib/services/authorization";


export async function createBuyerRequest(
  buyerId: string,
  data: CreateBuyerRequestInput,
) {
  // Defense in depth: Verify user has buyer role
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, buyerId));

  if (!profile || profile.role !== 'buyer') {
    if (!profile) {
      trackAuthFailure("createBuyerRequest", {
        error: "user_profile_not_found",
        buyerId,
      });
    } else {
      trackUnauthorizedAttempt("createBuyerRequest", {
        error: "buyer_role_required",
        buyerId,
        role: profile.role,
      });
    }
    throw new AppError('Only buyers can create purchase requests', 'FORBIDDEN');
  }

  const meta = {
    ...(data.imageUrls.length ? { imageUrls: data.imageUrls } : {}),
    ...(data.wantsTradeIn
      ? {
          tradeIn: {
            reg: data.tradeInReg,
            km: data.tradeInKm,
            notes: data.tradeInNotes,
            imageUrls: data.tradeInImageUrls,
          },
        }
      : {}),
  };

  const qualityScore = calculateRequestQualityScore(data);

  const [inserted] = await db
    .insert(buyerRequests)
    .values({
      buyerId,
      title: data.title,
      make: data.make,
      model: data.model,
      generation: data.generation,

      yearFrom: data.yearFrom,
      yearTo: data.yearTo,

      maxKm: data.maxKm,
      minKm: data.minKm,

      condition: data.condition,
      fuelType: data.fuelType,
      gearbox: data.gearbox,
      bodyType: data.bodyType,

      budgetMin: data.budgetMin,
      budgetMax: data.budgetMax,
      currency: "NOK", // for now
      locationCity: data.locationCity,

      wantsTradeIn: data.wantsTradeIn,
      financingNeeded: data.financingNeeded,

      description: data.description,
      qualityScore,
      meta: Object.keys(meta).length ? meta : undefined,
    })
    .returning();

  trackBuyerEvent(buyerId, MarketplaceEvents.REQUEST_SCORED, {
    requestId: inserted.id,
    make: data.make,
    model: data.model,
    location: data.locationCity,
    budgetMax: data.budgetMax,
    qualityScore,
  });

  trackBuyerEvent(buyerId, MarketplaceEvents.REQUEST_CREATED, {
    requestId: inserted.id,
    make: data.make,
    model: data.model,
    location: data.locationCity,
    budgetMax: data.budgetMax,
    qualityScore,
  });

  void assignDealersToRequest(inserted.id, 4).catch((error) => {
    console.error("Failed to assign dealers to request:", error);
    trackEvent(MarketplaceEvents.REQUEST_ASSIGNMENT_FAILED, {
      requestId: inserted.id,
      buyerId,
      error: error instanceof Error ? error.message : String(error),
      context: "assignDealersToRequest",
    });
  });

  return inserted;
}

export async function listBuyerRequestsForBuyer(buyerId: string) {
  const rows = await db
    .select()
    .from(buyerRequests)
    .where(eq(buyerRequests.buyerId, buyerId))
    .orderBy(buyerRequests.createdAt);

  return rows;
}
