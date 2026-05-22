"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  setDealerRequestAction,
  type DealerRequestActionType,
} from "@/lib/services/dealerRequestActions";
import { getDealershipsForUser } from "@/lib/services/dealerships";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { stackServerApp } from "@/stack/server";
import { AppError } from "@/lib/errors";

const dealerRequestActionSchema = z.object({
  requestId: z.string().uuid(),
  action: z.enum(["declined", "bookmarked", "interested"]),
  reason: z.string().max(1000).optional(),
  redirectTo: z.string().optional(),
});

export async function setDealerRequestActionAction(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) throw new AppError("Du må være innlogget", "UNAUTHORIZED");

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);
  const dealership = dealerships[0];
  if (!dealership) {
    throw new AppError("Ingen forhandler er knyttet til denne kontoen", "FORBIDDEN");
  }

  const parsed = dealerRequestActionSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );

  if (!parsed.success) {
    throw new AppError("Ugyldig forespørselsvalg", "VALIDATION");
  }

  await setDealerRequestAction({
    dealershipId: dealership.id,
    userId: profile.userId,
    requestId: parsed.data.requestId,
    action: parsed.data.action as DealerRequestActionType,
    reason: parsed.data.reason,
  });

  revalidatePath("/dealer");
  revalidatePath("/dealer/requests");
  revalidatePath(`/dealer/requests/${parsed.data.requestId}`);

  if (parsed.data.redirectTo?.startsWith("/dealer")) {
    redirect(parsed.data.redirectTo);
  }
}
