// src/app/actions/offers.ts
"use server";

import { z } from "zod";
import { stackServerApp } from "@/stack/server";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { getDealershipsForUser } from "@/lib/services/dealerships";
import { createOfferForRequest } from "@/lib/services/offers";

const createOfferSchema = z.object({
  requestId: z.string().uuid(),
  carMake: z.string().min(1).max(100),
  carModel: z.string().min(1).max(100),
  carVariant: z.string().max(150).optional(),
  carYear: z.string().transform((val) => parseInt(val, 10)),
  carKm: z.string().transform((val) => parseInt(val, 10)),
  carRegNr: z.string().max(32).optional(),
  colorExterior: z.string().max(100).optional(),
  colorInterior: z.string().max(100).optional(),
  priceTotal: z.string().transform((val) => parseInt(val, 10)),
  shortMessageToBuyer: z.string().max(2000).optional(),
});

export async function createOfferAction(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error("Unauthorized");

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);

  if (dealerships.length === 0) {
    throw new Error("No dealership linked to this account");
  }

  const dealership = dealerships[0];

  const raw = Object.fromEntries(formData.entries());
  const parsed = createOfferSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const offer = await createOfferForRequest(
    profile.userId,
    dealership.id,
    parsed.data.requestId,
    parsed.data,
  );

  return {
    success: true as const,
    offerId: offer.id,
  };
}
