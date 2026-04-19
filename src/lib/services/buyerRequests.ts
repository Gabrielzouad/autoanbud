// src/lib/services/buyerRequests.ts
import { db, buyerRequests, userProfiles } from "@/db";
import { eq } from "drizzle-orm";
import { CreateBuyerRequestInput } from "../validation/buyerRequest";


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
    throw new Error('Only buyers can create purchase requests');
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
      meta: Object.keys(meta).length ? meta : undefined,
    })
    .returning();

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
