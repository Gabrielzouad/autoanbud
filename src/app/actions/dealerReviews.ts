"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createDealerReviewForBuyer } from "@/lib/services/dealerReviews";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { stackServerApp } from "@/stack/server";
import { AppError } from "@/lib/errors";

const dealerReviewSchema = z.object({
  offerId: z.string().uuid(),
  requestId: z.string().uuid(),
  rating: z
    .string()
    .transform((value) => Number.parseInt(value, 10))
    .pipe(z.number().int().min(1).max(5)),
  comment: z.string().max(1000).optional(),
});

export async function submitDealerReviewAction(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) throw new AppError("Du må være innlogget", "UNAUTHORIZED");

  const profile = await ensureUserProfile({ id: user.id });
  const raw = Object.fromEntries(formData.entries());
  const parsed = dealerReviewSchema.safeParse(raw);

  if (!parsed.success) {
    throw new AppError("Velg en vurdering fra 1 til 5.", "VALIDATION");
  }

  await createDealerReviewForBuyer(profile.userId, {
    offerId: parsed.data.offerId,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });

  revalidatePath(`/buyer/requests/${parsed.data.requestId}`);
  revalidatePath(`/buyer/requests/${parsed.data.requestId}/offers/${parsed.data.offerId}`);
  revalidatePath("/dealer");

  redirect(`/buyer/requests/${parsed.data.requestId}/offers/${parsed.data.offerId}`);
}
