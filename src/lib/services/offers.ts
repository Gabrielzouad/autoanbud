// src/lib/services/offers.ts
import { db, offers, buyerRequests, dealerships } from "@/db";
import { eq, desc, and, ne } from "drizzle-orm";

import { createNotificationForUser } from "@/lib/services/notifications";
import { getUserEmail, sendNewOfferEmail, sendEmailNotification } from "@/lib/email";
import { AppError } from "@/lib/errors";
import {
  isDealershipAssignedToRequest,
  getActiveOfferCount,
  updateRequestOfferCount,
} from "@/lib/services/requestAssignments";
import {
  trackAuthFailure,
  trackUnauthorizedAttempt,
  verifyDealershipAccess,
} from "@/lib/services/authorization";
import { updateDealerReputationMetrics } from "@/lib/services/dealerReputation";
import { trackBuyerEvent, trackEvent, MarketplaceEvents } from "@/lib/analytics";

export type CreateOfferInput = {
  carRegNr?: string;
  vin?: string;
  carMake: string;
  carModel: string;
  carVariant?: string;
  carYear: number;
  carKm: number;
  priceTotal: number;
  colorExterior?: string;
  colorInterior?: string;
  shortMessageToBuyer: string;
  deliveryTimeEstimate: string;
  warrantySummary: string;
  financingPossible: boolean;
  financingExample?: string;
};

function calculateOfferQualityScore(data: CreateOfferInput) {
  let score = 0;
  const maxScore = 100;

  // Basic car details
  if (data.carMake) score += 10;
  if (data.carModel) score += 10;
  if (data.carYear) score += 10;
  if (data.carKm || data.carKm === 0) score += 10;
  if (data.priceTotal || data.priceTotal === 0) score += 10;

  // Description / message quality
  const messageLength = data.shortMessageToBuyer?.trim().length || 0;
  if (messageLength >= 20) score += 15;
  if (messageLength >= 80) score += 10;

  // Value-added details
  if (data.deliveryTimeEstimate?.trim().length > 3) score += 15;
  if (data.warrantySummary?.trim().length > 10) score += 15;
  if (data.financingPossible) score += 10;
  if (data.financingExample && data.financingExample.trim().length > 10) score += 5;

  // Optional visual completeness
  if (data.carRegNr && data.carRegNr.trim().length > 0) score += 5;

  return Math.min(score, maxScore);
}

export async function createOfferForRequest(
  dealerUserId: string,
  dealershipId: string,
  requestId: string,
  data: CreateOfferInput,
) {
  // Authorization: Verify dealerUserId has access to dealershipId
  try {
    await verifyDealershipAccess(dealershipId, dealerUserId);
  } catch (error) {
    trackUnauthorizedAttempt("createOfferForRequest", {
      error: "unauthorized_dealership_access",
      dealerUserId,
      dealershipId,
    });
    throw error;
  }

  const [request] = await db
    .select()
    .from(buyerRequests)
    .where(eq(buyerRequests.id, requestId));

  if (!request) {
    throw new AppError("Forespørselen finnes ikke", "NOT_FOUND");
  }
  if (request.status !== "open") {
    throw new AppError("Forespørselen er ikke lenger åpen for tilbud", "CONFLICT");
  }

  // Check: dealership is assigned to this request
  const isAssigned = await isDealershipAssignedToRequest(requestId, dealershipId);
  if (!isAssigned) {
    trackEvent(MarketplaceEvents.OFFER_ASSIGNMENT_BLOCKED, {
      requestId,
      dealershipId,
      reason: "not_assigned",
    });
    trackUnauthorizedAttempt("createOfferForRequest", {
      error: "dealership_not_assigned",
      dealerUserId,
      dealershipId,
      requestId,
    });
    trackEvent(MarketplaceEvents.OFFER_SUBMISSION_BLOCKED, {
      requestId,
      dealershipId,
      dealerUserId,
      reason: "dealership_not_assigned",
    });
    throw new AppError(
      "Din forhandler er ikke blant de utvalgte for denne forespørselen",
      "FORBIDDEN",
    );
  }

  // Check dealer verification state before allowing an offer
  const [dealership] = await db
    .select({ verificationState: dealerships.verificationState })
    .from(dealerships)
    .where(eq(dealerships.id, dealershipId));

  if (!dealership) {
    trackAuthFailure("createOfferForRequest", {
      error: "dealership_not_found",
      dealerUserId,
      dealershipId,
      requestId,
    });
    throw new AppError("Forhandleren finnes ikke", "NOT_FOUND");
  }

  if (dealership.verificationState !== "pending" && dealership.verificationState !== "verified") {
    trackUnauthorizedAttempt("createOfferForRequest", {
      error: "dealership_not_verified_or_pending",
      dealerUserId,
      dealershipId,
      requestId,
      verificationState: dealership.verificationState,
    });
    trackEvent(MarketplaceEvents.OFFER_SUBMISSION_BLOCKED, {
      requestId,
      dealershipId,
      dealerUserId,
      reason: "dealership_not_verified_or_pending",
      verificationState: dealership.verificationState,
    });
    throw new AppError(
      "Forhandleren må være verifisert eller godkjent før du kan sende tilbud.",
      "FORBIDDEN",
    );
  }

  const offerQualityScore = calculateOfferQualityScore(data);
  trackEvent(MarketplaceEvents.OFFER_QUALITY_SCORED, {
    requestId,
    dealershipId,
    dealerUserId,
    qualityScore: offerQualityScore,
  });

  if (offerQualityScore < 60) {
    trackEvent(MarketplaceEvents.OFFER_INCOMPLETE_ATTEMPT, {
      requestId,
      dealershipId,
      dealerUserId,
      qualityScore: offerQualityScore,
      minimumQualityScore: 60,
    });
    trackEvent(MarketplaceEvents.OFFER_SUBMISSION_BLOCKED, {
      requestId,
      dealershipId,
      dealerUserId,
      reason: "incomplete_offer",
      qualityScore: offerQualityScore,
    });
    throw new AppError(
      "Tilbudet er for ufullstendig. Legg til mer informasjon om levering, garanti og finansiering for å sende et bedre tilbud.",
      "VALIDATION",
    );
  }

  // Check: active offer count is below cap
  const activeOfferCount = await getActiveOfferCount(requestId);
  const offerCap = request.offerCap ?? 4;
  if (activeOfferCount >= offerCap) {
    trackEvent(MarketplaceEvents.OFFER_CAP_REACHED, {
      requestId,
      dealershipId,
      offerCap,
      currentCount: activeOfferCount,
    });
    trackEvent(MarketplaceEvents.REQUEST_OFFER_LIMIT_REACHED, {
      requestId,
      dealershipId,
      offerCap,
      currentCount: activeOfferCount,
    });
    trackEvent(MarketplaceEvents.OFFER_SUBMISSION_BLOCKED, {
      requestId,
      dealershipId,
      dealerUserId,
      reason: "offer_cap_reached",
    });
    throw new AppError("Denne forespørselen har nådd maksimalt antall tilbud", "CONFLICT");
  }

  const [offer] = await db
    .insert(offers)
    .values({
      requestId,
      dealershipId,
      dealerUserId,

      status: "submitted",

      carRegNr: data.carRegNr,
      vin: data.vin,
      carMake: data.carMake,
      carModel: data.carModel,
      carVariant: data.carVariant,
      carYear: data.carYear,
      carKm: data.carKm,

      carCondition: request.condition ?? "used",
      fuelType: request.fuelType,
      gearbox: request.gearbox,
      bodyType: request.bodyType,

      colorExterior: data.colorExterior,
      colorInterior: data.colorInterior,

      priceTotal: data.priceTotal,
      currency: "NOK",
      deliveryTimeEstimate: data.deliveryTimeEstimate,
      warrantySummary: data.warrantySummary,
      financingPossible: data.financingPossible,
      financingExample: data.financingExample,
      qualityScore: offerQualityScore,

      shortMessageToBuyer: data.shortMessageToBuyer,
    })
    .returning();

  // Update request active offer count
  await updateRequestOfferCount(requestId, activeOfferCount + 1);

  // Track offer submission
  trackEvent(MarketplaceEvents.OFFER_SUBMITTED, {
    offerId: offer.id,
    requestId,
    dealershipId,
    dealerUserId,
    qualityScore: offerQualityScore,
    price: data.priceTotal,
  });
  await updateDealerReputationMetrics(dealershipId);

  await createNotificationForUser(
    request.buyerId,
    "offer_created",
    "Nytt tilbud mottatt",
    `Du har mottatt et nytt tilbud for forespørselen "${request.title}".`,
    offer.id,
    request.id,
  );

  const recipientEmail = await getUserEmail(request.buyerId);
  if (recipientEmail) {
    void sendNewOfferEmail(
      recipientEmail,
      recipientEmail,
      request.title,
      `${process.env.NEXT_PUBLIC_APP_URL ?? "https://autoanbud.com"}/buyer/requests/${request.id}/offers/${offer.id}`,
    );
  }

  return offer;
}

export async function acceptOfferForBuyer(offerId: string, buyerId: string) {
  const [row] = await db
    .select({ offer: offers, request: buyerRequests })
    .from(offers)
    .innerJoin(buyerRequests, eq(offers.requestId, buyerRequests.id))
    .where(and(eq(offers.id, offerId), eq(buyerRequests.buyerId, buyerId)));

  if (!row) {
    trackUnauthorizedAttempt("acceptOfferForBuyer", {
      error: "unauthorized_offer_access",
      offerId,
      buyerId,
    });
    throw new AppError("Tilbudet finnes ikke", "NOT_FOUND");
  }
  if (row.offer.status !== "submitted") throw new AppError("Tilbudet er ikke lenger tilgjengelig", "CONFLICT");

  const { offer, request } = row;
  const submittedOffersForRequest = await db
    .select({ dealershipId: offers.dealershipId })
    .from(offers)
    .where(
      and(eq(offers.requestId, request.id), eq(offers.status, "submitted")),
    );
  const affectedDealershipIds = Array.from(
    new Set([
      offer.dealershipId,
      ...submittedOffersForRequest.map((submittedOffer) => submittedOffer.dealershipId),
    ]),
  );

  await db.transaction(async (tx) => {
    await tx.update(offers).set({ status: "accepted" }).where(eq(offers.id, offerId));
    await tx
      .update(buyerRequests)
      .set({ status: "accepted", acceptedOfferId: offerId })
      .where(eq(buyerRequests.id, request.id));
    await tx
      .update(offers)
      .set({ status: "rejected" })
      .where(
        and(
          eq(offers.requestId, request.id),
          eq(offers.status, "submitted"),
          ne(offers.id, offerId),
        ),
      );
  });

  trackEvent(MarketplaceEvents.OFFER_ACCEPTED, {
    offerId,
    requestId: request.id,
    buyerId,
    dealershipId: offer.dealershipId,
    dealerUserId: offer.dealerUserId,
  });
  trackBuyerEvent(buyerId, MarketplaceEvents.BUYER_OFFER_SELECTED, {
    offerId,
    requestId: request.id,
    dealershipId: offer.dealershipId,
    offerQualityScore: offer.qualityScore,
  });
  for (const dealershipId of affectedDealershipIds) {
    await updateDealerReputationMetrics(dealershipId);
  }

  await createNotificationForUser(
    offer.dealerUserId,
    "offer_created",
    "Tilbudet ditt ble akseptert!",
    `Kjøper har akseptert tilbudet ditt for forespørselen "${request.title}".`,
    offerId,
    request.id,
  );

  const dealerEmail = await getUserEmail(offer.dealerUserId);
  if (dealerEmail) {
    const link = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://autoanbud.com"}/dealer/offers/${offerId}`;
    void sendEmailNotification(
      dealerEmail,
      "Tilbudet ditt ble akseptert!",
      `<h1>Tilbudet ditt ble akseptert</h1><p>Kjøper har akseptert tilbudet ditt for forespørselen "<strong>${request.title}</strong>".</p><p><a href="${link}">Se tilbudet her</a></p>`,
    );
  }
}

export async function rejectOfferForBuyer(offerId: string, buyerId: string) {
  // Authorization: Verify buyerId owns the request
  const [row] = await db
    .select({ offer: offers, request: buyerRequests })
    .from(offers)
    .innerJoin(buyerRequests, eq(offers.requestId, buyerRequests.id))
    .where(and(eq(offers.id, offerId), eq(buyerRequests.buyerId, buyerId)));

  if (!row) {
    trackUnauthorizedAttempt("rejectOfferForBuyer", {
      error: "unauthorized_offer_access",
      offerId,
      buyerId,
    });
    throw new AppError("Tilbudet finnes ikke", "UNAUTHORIZED");
  }
  if (row.offer.status !== "submitted") throw new AppError("Tilbudet kan ikke avslås", "CONFLICT");

  await db.update(offers).set({ status: "rejected" }).where(eq(offers.id, offerId));
  await updateDealerReputationMetrics(row.offer.dealershipId);

  trackEvent(MarketplaceEvents.OFFER_REJECTED, {
    offerId,
    requestId: row.request.id,
    buyerId,
    dealershipId: row.offer.dealershipId,
    dealerUserId: row.offer.dealerUserId,
  });

  await createNotificationForUser(
    row.offer.dealerUserId,
    "offer_created",
    "Tilbudet ditt ble avslått",
    `Kjøper avslo tilbudet ditt for forespørselen "${row.request.title}".`,
    offerId,
    row.request.id,
  );
}

// Offers for a given dealership, including basic request info
export async function listOffersForDealershipWithRequest(dealershipId: string) {
  const rows = await db
    .select({
      offer: offers,
      request: {
        id: buyerRequests.id,
        title: buyerRequests.title,
        make: buyerRequests.make,
        model: buyerRequests.model,
        yearFrom: buyerRequests.yearFrom,
        meta: buyerRequests.meta,
      },
    })
    .from(offers)
    .innerJoin(buyerRequests, eq(offers.requestId, buyerRequests.id))
    .where(eq(offers.dealershipId, dealershipId))
    .orderBy(desc(offers.createdAt));

  return rows;
}

export async function listOffersForBuyerRequest(
  requestId: string,
  buyerId: string,
) {
  const rows = await db
    .select({
      offer: offers,
      dealership: {
        id: dealerships.id,
        name: dealerships.name,
        city: dealerships.city,
      },
    })
    .from(offers)
    .innerJoin(buyerRequests, eq(offers.requestId, buyerRequests.id))
    .innerJoin(dealerships, eq(offers.dealershipId, dealerships.id))
    .where(
      and(
        eq(offers.requestId, requestId),
        eq(buyerRequests.buyerId, buyerId),
      ),
    )
    .orderBy(desc(offers.createdAt));

  return rows;
}
