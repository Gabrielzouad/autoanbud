// src/lib/services/offerMessages.ts
import { asc, eq } from "drizzle-orm";

import {
  db,
  offers,
  buyerRequests,
  dealerships,
  offerMessages,
} from "@/db";
import { createNotificationForUser } from "@/lib/services/notifications";
import { getUserEmail, sendNewMessageEmail } from "@/lib/email";

type ConversationContext = {
  requestId: string;
  buyerId: string;
  dealerUserId: string;
  requestTitle: string;
  viewerRole: "dealer" | "buyer";
};

export type OfferMessageView = {
  id: string;
  offerId: string;
  senderId: string;
  senderRole: "dealer" | "buyer" | "admin";
  message: string;
  createdAt: string;
};

async function getConversationContext(
  offerId: string,
  userId: string,
): Promise<ConversationContext> {
  const [row] = await db
    .select({
      offer: offers,
      request: buyerRequests,
      dealership: dealerships,
    })
    .from(offers)
    .innerJoin(buyerRequests, eq(offers.requestId, buyerRequests.id))
    .innerJoin(dealerships, eq(offers.dealershipId, dealerships.id))
    .where(eq(offers.id, offerId));

  if (!row) {
    throw new Error("Offer not found");
  }

  const isDealer =
    row.dealership.ownerId === userId || row.offer.dealerUserId === userId;
  const isBuyer = row.request.buyerId === userId;

  if (!isDealer && !isBuyer) {
    throw new Error("Unauthorized");
  }

  return {
    requestId: row.request.id,
    buyerId: row.request.buyerId,
    dealerUserId: row.offer.dealerUserId,
    requestTitle: row.request.title,
    viewerRole: isDealer ? "dealer" : "buyer",
  };
}

export async function listOfferMessagesForUser(
  offerId: string,
  userId: string,
) {
  const context = await getConversationContext(offerId, userId);

  const rows = await db
    .select()
    .from(offerMessages)
    .where(eq(offerMessages.offerId, offerId))
    .orderBy(asc(offerMessages.createdAt));

  const messages: OfferMessageView[] = rows.map((msg) => ({
    id: msg.id,
    offerId: msg.offerId,
    senderId: msg.senderId,
    senderRole: msg.senderRole,
    message: msg.message,
    createdAt:
      msg.createdAt instanceof Date
        ? msg.createdAt.toISOString()
        : new Date(msg.createdAt).toISOString(),
  }));

  return { messages, context };
}

export async function createOfferMessageForUser(
  offerId: string,
  userId: string,
  message: string,
) {
  const context = await getConversationContext(offerId, userId);

  const [inserted] = await db
    .insert(offerMessages)
    .values({
      offerId,
      senderId: userId,
      senderRole: context.viewerRole,
      message,
    })
    .returning();

  const recipientId =
    context.viewerRole === "dealer"
      ? context.buyerId
      : context.dealerUserId;

  await createNotificationForUser(
    recipientId,
    "offer_message",
    "Ny melding på tilbudet ditt",
    `Du har fått en ny melding på forespørselen "${context.requestTitle}".`,
    offerId,
    context.requestId,
  );

  const recipientEmail = await getUserEmail(recipientId);
  if (recipientEmail) {
    const senderLabel = context.viewerRole === "dealer" ? "Forhandler" : "Kjøper";
    const messageLink =
      recipientId === context.buyerId
        ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://autoanbud.com"}/buyer/requests/${context.requestId}/offers/${offerId}`
        : `${process.env.NEXT_PUBLIC_APP_URL ?? "https://autoanbud.com"}/dealer/offers/${offerId}`;

    void sendNewMessageEmail(
      recipientEmail,
      senderLabel,
      context.requestTitle,
      messageLink,
    );
  }

  const created: OfferMessageView = {
    id: inserted.id,
    offerId: inserted.offerId,
    senderId: inserted.senderId,
    senderRole: inserted.senderRole,
    message: inserted.message,
    createdAt:
      inserted.createdAt instanceof Date
        ? inserted.createdAt.toISOString()
        : new Date(inserted.createdAt).toISOString(),
  };

  return { message: created, context };
}
