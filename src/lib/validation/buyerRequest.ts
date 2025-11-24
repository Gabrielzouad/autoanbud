// src/lib/validation/buyerRequest.ts
import { z } from "zod";

const numberFromString = (fallback?: number) =>
  z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(val, 10) : fallback;
      return Number.isNaN(parsed) ? fallback : parsed;
    });

const optionalTrimmed = (max?: number) => {
  const base = typeof max === "number" ? z.string().max(max) : z.string();
  return base.optional().transform((val) => {
    const trimmed = (val ?? "").trim();
    return trimmed.length ? trimmed : undefined;
  });
};

export const createBuyerRequestSchema = z.object({
  title: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(3, "Tittel må være minst 3 tegn").max(200, "Tittelen er for lang"),
  ),

  make: optionalTrimmed(100).default("Ukjent"),
  model: optionalTrimmed(100).default("Ukjent"),
  generation: optionalTrimmed(100),

  yearFrom: numberFromString(),
  yearTo: numberFromString(),

  maxKm: numberFromString(),
  minKm: numberFromString(),

  condition: z.enum(["new", "used", "demo"]).optional(),
  fuelType: z
    .enum(["petrol", "diesel", "hybrid", "ev", "other"])
    .optional()
    .or(z.literal("").transform(() => undefined)),
  gearbox: z.enum(["automatic", "manual", "any"]).optional(),
  bodyType: z
    .enum([
      "suv",
      "sedan",
      "wagon",
      "hatchback",
      "coupe",
      "convertible",
      "van",
      "pickup",
      "other",
    ])
    .optional()
    .or(z.literal("").transform(() => undefined)),

  budgetMin: numberFromString(),
  budgetMax: numberFromString().refine(
    (val) => val === undefined || val >= 0,
    "Budsjett må være positivt",
  ),

  locationCity: optionalTrimmed(120),
  locationPostalCode: optionalTrimmed(16),
  searchRadiusKm: numberFromString(),

  wantsTradeIn: z
    .string()
    .optional()
    .transform((val) => val === "on"),
  financingNeeded: z
    .string()
    .optional()
    .transform((val) => val === "on"),

  description: optionalTrimmed(5000),
  searchType: optionalTrimmed(),

  imageUrls: z.preprocess(
    (val) => {
      if (typeof val !== "string" || val.length === 0) return [];
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed)
          ? parsed.filter((item) => typeof item === "string")
          : [];
      } catch {
        return [];
      }
    },
    z.array(z.string()).default([]),
  ),
});

export type CreateBuyerRequestInput = z.infer<typeof createBuyerRequestSchema>;
