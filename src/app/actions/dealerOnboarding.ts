// src/app/actions/dealerOnboarding.ts
"use server";

import { z } from "zod";
import { stackServerApp } from "@/stack/server";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { createDealershipForUser } from "@/lib/services/dealerships";

const dealerOnboardingSchema = z.object({
  name: z.string().min(2).max(200),
  orgNumber: z.string().min(4).max(32),
  city: z.string().max(120).optional(),
  postalCode: z.string().max(16).optional(),
  address: z.string().max(255).optional(),
});

export async function dealerOnboardingAction(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error("Unauthorized");

  const profile = await ensureUserProfile({ id: user.id });

  const raw = Object.fromEntries(formData.entries());
  const parsed = dealerOnboardingSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const dealer = await createDealershipForUser(profile.userId, parsed.data);

  return {
    success: true as const,
    dealershipId: dealer.id,
  };
}
