// src/app/actions/buyerRequests.ts
"use server";

import { redirect } from "next/navigation";

import { createBuyerRequestSchema } from "@/lib/validation/buyerRequest";
import { createBuyerRequest } from "@/lib/services/buyerRequests";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { stackServerApp } from "@/stack/server";
import { trackEvent, MarketplaceEvents } from "@/lib/analytics";
import { AppError } from "@/lib/errors";

export type CreateBuyerRequestActionState = {
  success: boolean;
  requestId?: string;
  errors?: Record<string, string[] | undefined>;
  formError?: string;
};

const initialCreateBuyerRequestState: CreateBuyerRequestActionState = {
  success: false,
};

function getPayloadDiagnostics(formData: FormData) {
  const imageUrls = formData.get("imageUrls");
  const tradeInImageUrls = formData.get("tradeInImageUrls");
  const countJsonArray = (value: FormDataEntryValue | null) => {
    if (typeof value !== "string" || value.length === 0) return 0;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  return {
    requestType: formData.get("requestType"),
    searchType: formData.get("searchType"),
    hasTitle: Boolean(formData.get("title")),
    hasLocation: Boolean(formData.get("locationCity")),
    hasCoordinates: Boolean(formData.get("locationLat")) && Boolean(formData.get("locationLng")),
    hasBudget: Boolean(formData.get("budgetMax")),
    hasVehicleIdentity: Boolean(formData.get("make")) || Boolean(formData.get("model")),
    hasOpenSearchBodyType: Boolean(formData.get("bodyType")),
    hasOpenSearchSeats: Boolean(formData.get("seats")),
    descriptionLength:
      typeof formData.get("description") === "string"
        ? String(formData.get("description")).length
        : 0,
    hasImageUrls: typeof imageUrls === "string" && imageUrls.length > 2,
    imageUrlCount: countJsonArray(imageUrls),
    tradeInImageUrlCount: countJsonArray(tradeInImageUrls),
    imageUrlPayloadBytes: typeof imageUrls === "string" ? imageUrls.length : 0,
    tradeInImageUrlPayloadBytes:
      typeof tradeInImageUrls === "string" ? tradeInImageUrls.length : 0,
    fieldCount: Array.from(formData.keys()).length,
  };
}

export async function createBuyerRequestAction(formData: FormData) {
  const startedAt = Date.now();

  try {
    // 1) Get authenticated user from Stack Auth
    const user = await stackServerApp.getUser();

    if (!user) {
      trackEvent(MarketplaceEvents.REQUEST_CREATE_FAILED, {
        reason: "unauthorized",
        ...getPayloadDiagnostics(formData),
      });
      return {
        success: false as const,
        formError: "Du må være innlogget for å opprette en forespørsel.",
      };
    }

    // 2) Ensure we have a user_profiles row
    const profile = await ensureUserProfile({ id: user.id });

    // 3) Parse and validate form data with Zod
    const raw = Object.fromEntries(formData.entries());
    const parsed = createBuyerRequestSchema.safeParse(raw);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      trackEvent(MarketplaceEvents.REQUEST_VALIDATION_FAILED, {
        userId: profile.userId,
        durationMs: Date.now() - startedAt,
        fields: Object.keys(errors),
        ...getPayloadDiagnostics(formData),
      });
      return {
        success: false as const,
        errors,
        formError: "Sjekk feltene og prøv igjen.",
      };
    }

    // 4) Create the buyer request using the profile.userId
    const request = await createBuyerRequest(profile.userId, parsed.data);

    return {
      success: true as const,
      requestId: request.id,
    };
  } catch (error) {
    const message =
      error instanceof AppError
        ? error.message
        : "Kunne ikke opprette forespørselen. Prøv igjen.";

    trackEvent(MarketplaceEvents.REQUEST_CREATE_FAILED, {
      durationMs: Date.now() - startedAt,
      reason: error instanceof AppError ? error.code : "unexpected_error",
      error: error instanceof Error ? error.message : String(error),
      ...getPayloadDiagnostics(formData),
    });

    return {
      success: false as const,
      formError: message,
    };
  }
}

export async function createBuyerRequestFormAction(
  previousState: CreateBuyerRequestActionState = initialCreateBuyerRequestState,
  formData: FormData,
): Promise<CreateBuyerRequestActionState> {
  void previousState;

  const result = await createBuyerRequestAction(formData);

  if (result.success) {
    redirect("/buyer/requests");
  }

  return result;
}
