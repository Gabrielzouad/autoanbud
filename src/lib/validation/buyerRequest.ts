// src/lib/validation/buyerRequest.ts
import { z } from "zod";

import {
  canonicalizeVehicleMake,
  canonicalizeVehicleModel,
  normalizeVehicleMake,
} from "@/lib/vehicleCatalog";

const MAX_REQUEST_IMAGE_URLS = 8;
const MAX_TRADE_IN_IMAGE_URLS = 8;

const normalizeIntegerText = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  return trimmed
    .replace(/\s+/g, "")
    .replace(/[,.](?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
};

const numberFromString = (fallback?: number) =>
  z
    .string()
    .optional()
    .transform((val) => {
      const parsed = val ? parseInt(normalizeIntegerText(val), 10) : fallback;
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

const latitudeFromString = () =>
  floatFromString().refine(
    (val) => val === undefined || (val >= -90 && val <= 90),
    "Breddegrad er ugyldig",
  );

const longitudeFromString = () =>
  floatFromString().refine(
    (val) => val === undefined || (val >= -180 && val <= 180),
    "Lengdegrad er ugyldig",
  );

const optionalTrimmed = (max?: number) => {
  const base = typeof max === "number" ? z.string().max(max) : z.string();
  return base.optional().transform((val) => {
    const trimmed = (val ?? "").trim();
    return trimmed.length ? trimmed : undefined;
  });
};

const requestTypeSchema = z.enum(["fixed", "open"]);

const jsonUrlArrayField = (maxItems: number, message: string) =>
  z.preprocess(
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
    z.array(z.string().url("Bilde-URL er ugyldig")).max(maxItems, message).default([]),
  );

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
  seats: numberFromString().refine(
    (val) => val === undefined || (val >= 1 && val <= 9),
    "Antall seter må være mellom 1 og 9",
  ),

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
    (val) => val !== undefined && val > 0,
    "Budsjett må være større enn 0",
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
  locationLat: latitudeFromString(),
  locationLng: longitudeFromString(),

  imageUrls: jsonUrlArrayField(
    MAX_REQUEST_IMAGE_URLS,
    `Du kan legge ved maks ${MAX_REQUEST_IMAGE_URLS} bilder.`,
  ),

  tradeInImageUrls: jsonUrlArrayField(
    MAX_TRADE_IN_IMAGE_URLS,
    `Du kan legge ved maks ${MAX_TRADE_IN_IMAGE_URLS} innbyttebilder.`,
  ),
})
  .transform((data) => {
    const requestType =
      data.requestType ??
      (data.searchType === "general" || (!data.make && !data.model)
        ? "open"
        : "fixed");
    const make = data.make ? canonicalizeVehicleMake(data.make) : undefined;
    const model = data.model
      ? canonicalizeVehicleModel(make ?? data.make ?? "", data.model)
      : undefined;

    return {
      ...data,
      requestType,
      make: make ?? "Ukjent",
      model: model ?? "Ukjent",
    };
  })
  .superRefine((data, ctx) => {
    if (
      (data.locationLat === undefined && data.locationLng !== undefined) ||
      (data.locationLat !== undefined && data.locationLng === undefined)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["locationCity"],
        message: "Velg et sted med både breddegrad og lengdegrad, eller bruk kun stedsnavn.",
      });
    }

    if (data.requestType !== "fixed") return;

    if (!data.make || data.make === "Ukjent") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["make"],
        message: "Merke er påkrevd for spesifikt søk",
      });
    } else if (!normalizeVehicleMake(data.make)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["make"],
        message: "Velg et kjent bilmerke fra listen",
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
