// src/lib/services/offers.ts
import { db, offers, buyerRequests, dealerships } from "@/db";
import { eq, desc, and} from "drizzle-orm";

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

  if (!request || request.status !== "open") {
    throw new Error("Request not found or not open");
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

  return offer;
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
        locationCity: buyerRequests.locationCity,
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
