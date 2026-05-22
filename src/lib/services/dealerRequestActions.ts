import { and, eq, inArray } from "drizzle-orm";

import {
  db,
  dealerRequestAction,
  dealerRequestActions,
  requestAssignments,
} from "@/db";
import { MarketplaceEvents, trackDealerEvent } from "@/lib/analytics";
import { AppError } from "@/lib/errors";
import { verifyDealershipAccess } from "@/lib/services/authorization";

export type DealerRequestActionType =
  (typeof dealerRequestAction.enumValues)[number];

export type DealerRequestActionView = {
  id: string;
  requestId: string;
  dealershipId: string;
  userId: string;
  action: DealerRequestActionType;
  reason: string;
  createdAt: Date;
  updatedAt: Date;
};

const analyticsByAction: Record<DealerRequestActionType, string> = {
  declined: MarketplaceEvents.REQUEST_DECLINED,
  bookmarked: MarketplaceEvents.REQUEST_BOOKMARKED,
  interested: MarketplaceEvents.REQUEST_INTERESTED,
};

export function getDealerRequestActionLabel(action?: DealerRequestActionType | null) {
  switch (action) {
    case "declined":
      return "Avslått";
    case "bookmarked":
      return "Lagret";
    case "interested":
      return "Interessert";
    default:
      return null;
  }
}

export async function getDealerRequestActionMap(
  dealershipId: string,
  requestIds: string[],
) {
  if (requestIds.length === 0) return new Map<string, DealerRequestActionView>();

  const rows = await db
    .select()
    .from(dealerRequestActions)
    .where(
      and(
        eq(dealerRequestActions.dealershipId, dealershipId),
        inArray(dealerRequestActions.requestId, requestIds),
      ),
    );

  return new Map(
    rows.map((row) => [
      row.requestId,
      {
        id: row.id,
        requestId: row.requestId,
        dealershipId: row.dealershipId,
        userId: row.userId,
        action: row.action,
        reason: row.reason,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
    ]),
  );
}

export async function getDealerRequestAction(
  dealershipId: string,
  requestId: string,
) {
  const actionMap = await getDealerRequestActionMap(dealershipId, [requestId]);
  return actionMap.get(requestId) ?? null;
}

export async function setDealerRequestAction({
  dealershipId,
  userId,
  requestId,
  action,
  reason,
}: {
  dealershipId: string;
  userId: string;
  requestId: string;
  action: DealerRequestActionType;
  reason?: string;
}) {
  await verifyDealershipAccess(dealershipId, userId);

  const [assignment] = await db
    .select()
    .from(requestAssignments)
    .where(
      and(
        eq(requestAssignments.dealershipId, dealershipId),
        eq(requestAssignments.requestId, requestId),
      ),
    );

  if (!assignment) {
    throw new AppError("Forespørselen er ikke tildelt denne forhandleren", "FORBIDDEN");
  }

  if (!assignment.isActive && action !== "declined") {
    throw new AppError("Forespørselen er ikke lenger aktiv for denne forhandleren", "CONFLICT");
  }

  const trimmedReason = reason?.trim() ?? "";
  const now = new Date();
  const [existingAction] = await db
    .select()
    .from(dealerRequestActions)
    .where(
      and(
        eq(dealerRequestActions.dealershipId, dealershipId),
        eq(dealerRequestActions.requestId, requestId),
      ),
    );

  const [savedAction] = existingAction
    ? await db
        .update(dealerRequestActions)
        .set({
          userId,
          action,
          reason: trimmedReason,
          updatedAt: now,
        })
        .where(eq(dealerRequestActions.id, existingAction.id))
        .returning()
    : await db
        .insert(dealerRequestActions)
        .values({
          dealershipId,
          userId,
          requestId,
          action,
          reason: trimmedReason,
        })
        .returning();

  if (action === "declined" && assignment.isActive) {
    await db
      .update(requestAssignments)
      .set({ isActive: false, status: "declined" })
      .where(eq(requestAssignments.id, assignment.id));
  }

  trackDealerEvent(dealershipId, analyticsByAction[action], {
    requestId,
    userId,
    action,
    reason: trimmedReason || undefined,
  });

  return savedAction;
}
