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

const floatFromString = () =>
  z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseFloat(val) : undefined;
      return Number.isNaN(parsed) ? undefined : parsed;
    });

const optionalTrimmed = (max?: number) => {
  const base = typeof max === "number" ? z.string().max(max) : z.string();
  return base.optional().transform((val) => {
    const trimmed = (val ?? "").trim();
    return trimmed.length ? trimmed : undefined;
  });
};

const requestTypeSchema = z.enum(["fixed", "open"]);

export const createBuyerRequestSchema = z
  .object({
  title: z.preprocess(
    (val) => (typeof val === "string" ? val.trim() : val),
    z.string().min(3, "Tittel må være minst 3 tegn").max(200, "Tittelen er for lang"),
  ),

  requestType: requestTypeSchema.optional(),
  make: optionalTrimmed(100),
  model: optionalTrimmed(100),
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

  wantsTradeIn: z
    .string()
    .optional()
    .transform((val) => val === "on"),
  financingNeeded: z
    .string()
    .optional()
    .transform((val) => val === "on"),

  tradeInReg: optionalTrimmed(20),
  tradeInKm: numberFromString(),
  tradeInNotes: optionalTrimmed(2000),

  description: optionalTrimmed(5000),
  searchType: optionalTrimmed(),

  locationCity: optionalTrimmed(120),
  locationLat: floatFromString(),
  locationLng: floatFromString(),

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

  tradeInImageUrls: z.preprocess(
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
})
  .transform((data) => {
    const requestType =
      data.requestType ??
      (data.searchType === "general" || (!data.make && !data.model)
        ? "open"
        : "fixed");

    return {
      ...data,
      requestType,
      make: data.make ?? "Ukjent",
      model: data.model ?? "Ukjent",
    };
  })
  .superRefine((data, ctx) => {
    if (data.requestType !== "fixed") return;

    if (!data.make || data.make === "Ukjent") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["make"],
        message: "Merke er påkrevd for spesifikt søk",
      });
    }

    if (!data.model || data.model === "Ukjent") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["model"],
        message: "Modell er påkrevd for spesifikt søk",
      });
    }
  });

export type CreateBuyerRequestInput = z.infer<typeof createBuyerRequestSchema>;
