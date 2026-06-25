// src/app/actions/offers.ts
"use server";

import { z } from "zod";
import { stackServerApp } from "@/stack/server";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { getDealershipsForUser } from "@/lib/services/dealerships";
import { createOfferForRequest, acceptOfferForBuyer, rejectOfferForBuyer } from "@/lib/services/offers";
import { redirect } from "next/navigation";
import { AppError } from "@/lib/errors";

const requiredText = (label: string, min = 1, max = 200) =>
  z
    .string()
    .trim()
    .min(min, `${label} må være minst ${min} tegn`)
    .max(max, `${label} kan maks være ${max} tegn`);

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Kan maks være ${max} tegn`)
    .optional()
    .or(z.literal(""));

const numberField = (label: string, min = 0, max = Number.MAX_SAFE_INTEGER) =>
  z
    .string()
    .trim()
    .min(1, `${label} må fylles ut`)
    .transform((value) => Number.parseInt(value, 10))
    .refine((value) => Number.isFinite(value), `${label} må være et tall`)
    .refine((value) => value >= min, `${label} må være minst ${min}`)
    .refine((value) => value <= max, `${label} kan maks være ${max}`);

const createOfferSchema = z.object({
  requestId: z.string().uuid(),
  carMake: requiredText("Merke", 1, 100),
  carModel: requiredText("Modell", 1, 100),
  carVariant: optionalText(150),
  carYear: numberField("Årsmodell", 1900, 2100),
  carKm: numberField("Kilometerstand", 0),
  carRegNr: optionalText(32),
  colorExterior: optionalText(100),
  colorInterior: optionalText(100),
  priceTotal: numberField("Tilbudspris", 1),
  deliveryTimeEstimate: requiredText("Leveringstid", 3, 200),
  warrantySummary: requiredText("Garantibeskrivelse", 10, 200),
  inspectionIncluded: z.string().optional().transform((val) => val === 'on'),
  financingPossible: z.string().optional().transform((val) => val === 'on'),
  financingExample: optionalText(500),
  shortMessageToBuyer: requiredText("Melding til kjøper", 20, 2000),
});

export async function createOfferAction(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) throw new AppError("Du må være innlogget", "UNAUTHORIZED");

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);

  if (dealerships.length === 0) {
    throw new AppError("Ingen forhandler er knyttet til denne kontoen", "FORBIDDEN");
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

export async function acceptOfferAction(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) throw new AppError("Du må være innlogget", "UNAUTHORIZED");

  const profile = await ensureUserProfile({ id: user.id });
  const offerId = formData.get("offerId") as string;
  const requestId = formData.get("requestId") as string;

  await acceptOfferForBuyer(offerId, profile.userId);
  redirect(`/buyer/requests/${requestId}`);
}

export async function rejectOfferAction(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) throw new AppError("Du må være innlogget", "UNAUTHORIZED");

  const profile = await ensureUserProfile({ id: user.id });
  const offerId = formData.get("offerId") as string;
  const requestId = formData.get("requestId") as string;

  await rejectOfferForBuyer(offerId, profile.userId);
  redirect(`/buyer/requests/${requestId}/offers/${offerId}`);
}
