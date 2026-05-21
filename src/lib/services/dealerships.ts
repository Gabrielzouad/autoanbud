// src/lib/services/dealerships.ts
import { db, dealerships, dealerMembers, userProfiles } from "@/db";
import { and, eq } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import {
  trackAuthFailure,
  trackUnauthorizedAttempt,
  verifyDealershipRole,
} from "@/lib/services/authorization";

type CreateDealershipInput = {
  name: string;
  orgNumber: string;
  city?: string;
  postalCode?: string;
  address?: string;
  phone?: string;
  email?: string;
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

export async function updateDealership(
  userId: string,
  dealershipId: string,
  data: Partial<CreateDealershipInput>,
) {
  await verifyDealershipRole(dealershipId, userId, "manager");

  const [updated] = await db
    .update(dealerships)
    .set({
      name: data.name,
      orgNumber: data.orgNumber,
      city: data.city,
      postalCode: data.postalCode,
      address: data.address,
      phone: data.phone,
      email: data.email,
    })
    .where(eq(dealerships.id, dealershipId))
    .returning();

  if (!updated) {
    trackAuthFailure("updateDealership", {
      error: "dealership_not_found_after_authorization",
      dealershipId,
      userId,
    });
    throw new AppError("Forhandleren finnes ikke", "NOT_FOUND");
  }

  return updated;
}

export async function getDealershipForUser(
  userId: string,
  dealershipId: string,
) {
  const [dealership] = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.id, dealershipId));

  if (!dealership) {
    trackAuthFailure("getDealershipForUser", {
      error: "dealership_not_found",
      dealershipId,
      userId,
    });
    throw new AppError("Forhandleren finnes ikke", "NOT_FOUND");
  }

  if (dealership.ownerId === userId) {
    return dealership;
  }

  const [member] = await db
    .select()
    .from(dealerMembers)
    .where(
      and(
        eq(dealerMembers.dealershipId, dealershipId),
        eq(dealerMembers.userId, userId),
      ),
    );

  if (!member) {
    trackUnauthorizedAttempt("getDealershipForUser", {
      error: "unauthorized_dealership_access",
      dealershipId,
      userId,
    });
    throw new AppError("Du har ikke tilgang til denne forhandleren", "FORBIDDEN");
  }

  return dealership;
}
