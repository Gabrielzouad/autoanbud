// src/lib/services/offers.ts
import { db, offers, buyerRequests, dealerships } from "@/db";
import { eq, desc, and, ne } from "drizzle-orm";

import { createNotificationForUser } from "@/lib/services/notifications";
import { getUserEmail, sendNewOfferEmail, sendEmailNotification } from "@/lib/email";
import { AppError } from "@/lib/errors";

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
  shortMessageToBuyer?: string;
};

export async function createOfferForRequest(
  dealerUserId: string,
  dealershipId: string,
  requestId: string,
  data: CreateOfferInput,
) {
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

      shortMessageToBuyer: data.shortMessageToBuyer,
    })
    .returning();

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

  if (!row) throw new AppError("Tilbudet finnes ikke", "NOT_FOUND");
  if (row.offer.status !== "submitted") throw new AppError("Tilbudet er ikke lenger tilgjengelig", "CONFLICT");

  const { offer, request } = row;

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
  const [row] = await db
    .select({ offer: offers, request: buyerRequests })
    .from(offers)
    .innerJoin(buyerRequests, eq(offers.requestId, buyerRequests.id))
    .where(and(eq(offers.id, offerId), eq(buyerRequests.buyerId, buyerId)));

  if (!row) throw new AppError("Tilbudet finnes ikke", "NOT_FOUND");
  if (row.offer.status !== "submitted") throw new AppError("Tilbudet kan ikke avslås", "CONFLICT");

  await db.update(offers).set({ status: "rejected" }).where(eq(offers.id, offerId));

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
