// src/lib/services/dealerRequests.ts
import { db, buyerRequests } from "@/db";
import { eq } from "drizzle-orm";

export async function listOpenBuyerRequests() {
  const rows = await db
    .select()
    .from(buyerRequests)
    .where(eq(buyerRequests.status, "open"))
    .orderBy(buyerRequests.createdAt);

  return rows;
}
