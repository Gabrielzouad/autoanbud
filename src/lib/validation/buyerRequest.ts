// src/lib/validation/buyerRequest.ts
import { z } from "zod";

export const createBuyerRequestSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title is too long"),
  make: z
    .string()
    .max(100)
    .optional()
    .transform((val) => {
      const trimmed = (val ?? "").trim();
      return trimmed.length ? trimmed : "Ukjent";
    }),
  model: z
    .string()
    .max(100)
    .optional()
    .transform((val) => {
      const trimmed = (val ?? "").trim();
      return trimmed.length ? trimmed : "Ukjent";
    }),
  generation: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("").transform(() => undefined)),

  yearFrom: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  yearTo: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

  maxKm: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  minKm: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

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

  budgetMin: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  budgetMax: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

  locationCity: z.string().max(120).optional(),
  locationPostalCode: z.string().max(16).optional(),
  searchRadiusKm: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),

  wantsTradeIn: z
    .string()
    .optional()
    .transform((val) => val === "on"),
  financingNeeded: z
    .string()
    .optional()
    .transform((val) => val === "on"),

  description: z.string().max(5000).optional(),

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
