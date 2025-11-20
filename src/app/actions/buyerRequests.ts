// src/app/actions/buyerRequests.ts
"use server";

import { createBuyerRequestSchema } from "@/lib/validation/buyerRequest";
import { createBuyerRequest } from "@/lib/services/buyerRequests";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { stackServerApp } from "@/stack/server";

export async function createBuyerRequestAction(formData: FormData) {
  // 1) Get authenticated user from Neon Auth
  const user = await stackServerApp.getUser();

  if (!user) {
    // Not logged in
    throw new Error("Unauthorized");
  }

  // 2) Ensure we have a user_profiles row
  const profile = await ensureUserProfile({ id: user.id });

  // 3) Parse and validate form data with Zod
  const raw = Object.fromEntries(formData.entries());
  const parsed = createBuyerRequestSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  // 4) Create the buyer request using the profile.userId
  const request = await createBuyerRequest(profile.userId, parsed.data);

  return {
    success: true as const,
    requestId: request.id,
  };
}
