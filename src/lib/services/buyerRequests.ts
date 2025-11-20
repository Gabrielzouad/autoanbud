// src/lib/services/buyerRequests.ts
import { db, buyerRequests } from "@/db";
import { eq } from "drizzle-orm";
import { CreateBuyerRequestInput } from "../validation/buyerRequest";


export async function createBuyerRequest(
  buyerId: string,
  data: CreateBuyerRequestInput,
) {
  // Later: you can add more rules here (e.g., rate limiting, checking userProfiles role)

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
      locationPostalCode: data.locationPostalCode,
      searchRadiusKm: data.searchRadiusKm,

      wantsTradeIn: data.wantsTradeIn,
      financingNeeded: data.financingNeeded,

      description: data.description,
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
