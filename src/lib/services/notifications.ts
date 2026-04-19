import { and, desc, eq, sql } from "drizzle-orm";

import { db, buyerRequests, notifications, offers } from "@/db";

type NotificationType = "offer_created" | "offer_message";

export type NotificationView = {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  offerId?: string | null;
  requestId?: string | null;
  isRead: boolean;
  createdAt: string;
};

export async function createNotificationForUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  offerId?: string,
  requestId?: string,
) {
  const [created] = await db
    .insert(notifications)
    .values({
      userId,
      type,
      title,
      body,
      offerId,
      requestId,
    })
    .returning();

  return {
    id: created.id,
    type: created.type,
    title: created.title,
    body: created.body,
    offerId: created.offerId,
    requestId: created.requestId,
    isRead: created.isRead,
    createdAt:
      created.createdAt instanceof Date
        ? created.createdAt.toISOString()
        : new Date(created.createdAt).toISOString(),
  };
}

export async function countUnreadNotificationsForUser(userId: string) {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return Number(count ?? 0);
}

export async function listNotificationsForUser(userId: string) {
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));

  return rows.map((row) => ({
    id: row.id,
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    offerId: row.offerId,
    requestId: row.requestId,
    isRead: row.isRead,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(row.createdAt).toISOString(),
  }));
}

export async function markNotificationsReadForUser(userId: string) {
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
}
