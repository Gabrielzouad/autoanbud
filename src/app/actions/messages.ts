// src/app/actions/messages.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createOfferMessageForUser } from "@/lib/services/offerMessages";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { stackServerApp } from "@/stack/server";

const sendMessageSchema = z.object({
  offerId: z.string().uuid(),
  message: z.string().min(1).max(2000),
});

type SendMessageState =
  | { success: true; message: Awaited<ReturnType<typeof createOfferMessageForUser>>["message"] }
  | { success: false; error: string };

export async function sendOfferMessageAction(
  prevState: SendMessageState | undefined,
  formData: FormData,
): Promise<SendMessageState> {
  const user = await stackServerApp.getUser();
  if (!user) {
    return { success: false, error: "Du må være innlogget for å sende meldinger." };
  }

  const profile = await ensureUserProfile({ id: user.id });
  const raw = Object.fromEntries(formData.entries());
  const parsed = sendMessageSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: "Meldingen må inneholde tekst (maks 2000 tegn)." };
  }

  try {
    const result = await createOfferMessageForUser(
      parsed.data.offerId,
      profile.userId,
      parsed.data.message,
    );

    revalidatePath(`/dealer/offers/${parsed.data.offerId}`);
    revalidatePath(`/buyer/requests/${result.context.requestId}`);

    return { success: true, message: result.message };
  } catch (error) {
    console.error("Failed to send offer message", error);
    return { success: false, error: "Kunne ikke sende meldingen. Prøv igjen." };
  }
}
