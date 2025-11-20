// src/lib/services/dealerships.ts
import { db, dealerships, dealerMembers, userProfiles } from "@/db";
import { eq } from "drizzle-orm";

type CreateDealershipInput = {
  name: string;
  orgNumber: string;
  city?: string;
  postalCode?: string;
  address?: string;
};

export async function getDealershipsForUser(userId: string) {
  const rows = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.ownerId, userId));

  return rows;
}

export async function createDealershipForUser(
  userId: string,
  data: CreateDealershipInput,
) {
  // Create dealership
  const [dealer] = await db
    .insert(dealerships)
    .values({
      ownerId: userId,
      name: data.name,
      orgNumber: data.orgNumber,
      city: data.city,
      postalCode: data.postalCode,
      address: data.address,
      country: "NO",
    })
    .returning();

  // Add owner as a member
  await db.insert(dealerMembers).values({
    dealershipId: dealer.id,
    userId,
    role: "owner",
  });

  // Optionally mark profile as dealer
  await db
    .update(userProfiles)
    .set({ role: "dealer" })
    .where(eq(userProfiles.userId, userId));

  return dealer;
}
