// src/lib/services/dealerVerification.ts
import { db, dealerships } from "@/db";
import { eq } from "drizzle-orm";
import { trackEvent, MarketplaceEvents } from "@/lib/analytics";
import { verifyAdminUser, verifyDealershipRole } from "@/lib/services/authorization";

export type VerificationState = "draft" | "pending" | "verified" | "rejected";

export async function startDealerVerification(
  userId: string,
  dealershipId: string,
  notes: string,
) {
  await verifyDealershipRole(dealershipId, userId, "manager");

  const [updated] = await db
    .update(dealerships)
    .set({ verificationState: "pending", verificationNotes: notes })
    .where(eq(dealerships.id, dealershipId))
    .returning();

  trackEvent(MarketplaceEvents.DEALER_VERIFICATION_STARTED, {
    dealershipId,
    userId,
  });

  return updated;
}

export async function updateDealerVerificationState(
  adminUserId: string,
  dealershipId: string,
  state: VerificationState,
  notes?: string,
) {
  await verifyAdminUser(adminUserId);

  const values: any = { verificationState: state };

  if (state === "verified") {
    values.verified = true;
    values.verifiedAt = new Date();
  }

  if (state === "rejected") {
    values.verified = false;
  }

  if (typeof notes === "string") {
    values.verificationNotes = notes;
  }

  const [updated] = await db
    .update(dealerships)
    .set(values)
    .where(eq(dealerships.id, dealershipId))
    .returning();

  trackEvent(MarketplaceEvents.DEALER_VERIFICATION_COMPLETED, {
    dealershipId,
    adminUserId,
    state,
    notes,
  });

  return updated;
}

export async function getDealerVerification(dealershipId: string) {
  const [dealership] = await db
    .select({
      id: dealerships.id,
      verified: dealerships.verified,
      verificationState: dealerships.verificationState,
      verificationNotes: dealerships.verificationNotes,
      verifiedAt: dealerships.verifiedAt,
    })
    .from(dealerships)
    .where(eq(dealerships.id, dealershipId));

  return dealership;
}
