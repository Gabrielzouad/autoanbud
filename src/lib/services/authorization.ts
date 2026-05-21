/**
 * Authorization utilities for service functions.
 * All writes must verify user ownership or role before proceeding.
 */

import { db, dealerships, dealerMembers, userProfiles } from "@/db";
import { eq, and } from "drizzle-orm";
import { AppError } from "@/lib/errors";
import { trackEvent, MarketplaceEvents } from "@/lib/analytics";

export function trackAuthFailure(
  context: string,
  payload: Record<string, unknown>,
) {
  trackEvent(MarketplaceEvents.AUTH_CHECK_FAILED, {
    context,
    ...payload,
  });
}

export function trackUnauthorizedAttempt(
  context: string,
  payload: Record<string, unknown>,
) {
  trackEvent(MarketplaceEvents.AUTH_UNAUTHORIZED_ATTEMPT, {
    context,
    ...payload,
  });
}

/**
 * Verify that a user owns or is a member of a dealership.
 * Throws FORBIDDEN if not authorized.
 */
export async function verifyDealershipAccess(
  dealershipId: string,
  userId: string,
): Promise<boolean> {
  const [dealership] = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.id, dealershipId));

  if (!dealership) {
    trackAuthFailure("verifyDealershipAccess", {
      error: "dealership_not_found",
      dealershipId,
      userId,
    });
    throw new AppError("Forhandleren finnes ikke", "NOT_FOUND");
  }

  // Check if user is the owner
  if (dealership.ownerId === userId) {
    return true;
  }

  // Check if user is a member
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
    trackUnauthorizedAttempt("verifyDealershipAccess", {
      error: "unauthorized_access",
      dealershipId,
      userId,
    });
    throw new AppError(
      "Du har ikke tilgang til denne forhandleren",
      "FORBIDDEN",
    );
  }

  return true;
}

/**
 * Verify that a user is a dealership member with a given role or higher.
 * Owner > manager > employee
 */
export async function verifyDealershipRole(
  dealershipId: string,
  userId: string,
  minimumRole: "owner" | "manager" | "employee" = "manager",
): Promise<boolean> {
  const [dealership] = await db
    .select()
    .from(dealerships)
    .where(eq(dealerships.id, dealershipId));

  if (!dealership) {
    throw new AppError("Forhandleren finnes ikke", "NOT_FOUND");
  }

  // Owner has all permissions
  if (dealership.ownerId === userId) {
    return true;
  }

  // Check member role
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
    trackUnauthorizedAttempt("verifyDealershipRole", {
      error: "unauthorized_access",
      dealershipId,
      userId,
      requiredRole: minimumRole,
    });
    throw new AppError(
      "Du har ikke tilgang til denne forhandleren",
      "FORBIDDEN",
    );
  }

  // Simple role hierarchy check
  const roleHierarchy: Record<string, number> = {
    owner: 3,
    manager: 2,
    employee: 1,
  };

  const userRoleLevel = roleHierarchy[member.role] || 0;
  const requiredLevel = roleHierarchy[minimumRole];

  if (userRoleLevel < requiredLevel) {
    trackUnauthorizedAttempt("verifyDealershipRole", {
      error: "insufficient_role",
      dealershipId,
      userId,
      userRole: member.role,
      requiredRole: minimumRole,
    });
    throw new AppError(
      `Denne handlingen krever ${minimumRole}-tilgang`,
      "FORBIDDEN",
    );
  }

  return true;
}

export async function verifyAdminUser(userId: string): Promise<boolean> {
  const [profile] = await db
    .select({ role: userProfiles.role })
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId));

  if (!profile) {
    trackAuthFailure("verifyAdminUser", {
      error: "user_profile_not_found",
      userId,
    });
    throw new AppError("Brukeren finnes ikke", "NOT_FOUND");
  }

  if (profile.role !== "admin") {
    trackUnauthorizedAttempt("verifyAdminUser", {
      error: "admin_required",
      userId,
      role: profile.role,
    });
    throw new AppError("Denne handlingen krever admin-tilgang", "FORBIDDEN");
  }

  return true;
}
