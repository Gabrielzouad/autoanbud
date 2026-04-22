// src/app/actions/dealerOnboarding.ts
"use server";

import { z } from "zod";
import { stackServerApp } from "@/stack/server";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { createDealershipForUser, getDealershipsForUser, updateDealership } from "@/lib/services/dealerships";
import { createDealerCapability, getDealerCapability, updateDealerCapability } from "@/lib/services/dealerCapabilities";

const dealerOnboardingSchema = z.object({
  dealershipId: z.string().optional(),
  name: z.string().min(2).max(200),
  orgNumber: z.string().min(4).max(32),
  city: z.string().max(120).optional(),
  postalCode: z.string().max(16).optional(),
  address: z.string().max(255).optional(),
  makes: z.array(z.string()).min(1),
  models: z.array(z.string()).optional(),
  minYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  maxYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
  maxKm: z.number().int().min(0),
  fuelTypes: z.array(z.string()).optional(),
  gearboxTypes: z.array(z.string()).optional(),
  bodyTypes: z.array(z.string()).optional(),
  maxPrice: z.number().int().min(0),
  serviceRadius: z.number().int().min(0),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
    city: z.string().max(120),
  }),
});

type OnboardingPayload = z.infer<typeof dealerOnboardingSchema>;

function toRawObject(value: unknown) {
  if (value instanceof FormData) {
    return Object.fromEntries(value.entries());
  }

  return typeof value === 'object' && value !== null ? value : {};
}

export async function dealerOnboardingAction(rawData: unknown) {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error("Unauthorized");

  const profile = await ensureUserProfile({ id: user.id });
  const raw = toRawObject(rawData);

  const parsed = dealerOnboardingSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Validation failed:', parsed.error.flatten().fieldErrors);
    return {
      success: false as const,
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const input = parsed.data;
  const existingDealerships = await getDealershipsForUser(profile.userId);
  const dealershipId = input.dealershipId || existingDealerships[0]?.id;

  const dealership = dealershipId
    ? await updateDealership(dealershipId, {
        name: input.name,
        orgNumber: input.orgNumber,
        city: input.city,
        postalCode: input.postalCode,
        address: input.address,
      })
    : await createDealershipForUser(profile.userId, {
        name: input.name,
        orgNumber: input.orgNumber,
        city: input.city,
        postalCode: input.postalCode,
        address: input.address,
      });

  if (!dealership) {
    return { success: false as const, error: 'Unable to store dealership data' };
  }

  const existingCapabilities = dealership.id ? await getDealerCapability(dealership.id) : null;

  if (existingCapabilities) {
    try {
      await updateDealerCapability(dealership.id, {
        dealershipId: dealership.id,
        makes: input.makes,
        models: input.models ?? [],
        minYear: input.minYear,
        maxYear: input.maxYear,
        maxKm: input.maxKm,
        fuelTypes: input.fuelTypes ?? [],
        gearboxTypes: input.gearboxTypes ?? [],
        bodyTypes: input.bodyTypes ?? [],
        maxPrice: input.maxPrice,
        serviceRadius: input.serviceRadius,
        location: input.location,
      });
    } catch (error) {
      console.warn('Failed to update dealer capabilities (table might not exist):', error);
      // Continue without capabilities for now
    }
  } else {
    try {
      await createDealerCapability({
        dealershipId: dealership.id,
        makes: input.makes,
        models: input.models ?? [],
        minYear: input.minYear,
        maxYear: input.maxYear,
        maxKm: input.maxKm,
        fuelTypes: input.fuelTypes ?? [],
        gearboxTypes: input.gearboxTypes ?? [],
        bodyTypes: input.bodyTypes ?? [],
        maxPrice: input.maxPrice,
        serviceRadius: input.serviceRadius,
        location: input.location,
      });
    } catch (error) {
      console.warn('Failed to create dealer capabilities (table might not exist):', error);
      // Continue without capabilities for now
    }
  }

  return {
    success: true as const,
    dealershipId: dealership.id,
  };
}

const contactInfoSchema = z.object({
  dealershipId: z.string().uuid(),
  address: z.string().max(255).optional(),
  city: z.string().max(120).optional(),
  postalCode: z.string().max(16).optional(),
  phone: z.string().max(32).optional(),
  email: z.string().email().max(200).optional().or(z.literal('')),
});

export async function updateContactInfoAction(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) throw new Error("Unauthorized");

  const profile = await ensureUserProfile({ id: user.id });

  const parsed = contactInfoSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { success: false as const, errors: parsed.error.flatten().fieldErrors };
  }

  const dealerships = await getDealershipsForUser(profile.userId);
  const dealership = dealerships.find((d) => d.id === parsed.data.dealershipId);
  if (!dealership) throw new Error("Unauthorized");

  await updateDealership(dealership.id, {
    address: parsed.data.address,
    city: parsed.data.city,
    postalCode: parsed.data.postalCode,
    phone: parsed.data.phone || undefined,
    email: parsed.data.email || undefined,
  });

  return { success: true as const };
}
