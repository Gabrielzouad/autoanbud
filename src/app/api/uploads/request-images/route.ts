import { NextResponse } from "next/server";

import { trackEvent, MarketplaceEvents } from "@/lib/analytics";
import {
  uploadImageToBlob,
  validateImageFile,
  type ImageUploadPurpose,
} from "@/lib/storage";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { stackServerApp } from "@/stack/server";

export const runtime = "nodejs";

const MAX_FILES_PER_UPLOAD = 8;

const uploadPurposeValues = new Set<ImageUploadPurpose>([
  "request",
  "trade_in",
  "offer",
]);

function getUploadPurpose(value: FormDataEntryValue | null): ImageUploadPurpose {
  return typeof value === "string" && uploadPurposeValues.has(value as ImageUploadPurpose)
    ? (value as ImageUploadPurpose)
    : "request";
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const user = await stackServerApp.getUser();
  if (!user) {
    trackEvent(MarketplaceEvents.IMAGE_UPLOAD_ERROR, {
      reason: "unauthorized",
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await ensureUserProfile({ id: user.id });
  let formData: FormData;

  try {
    formData = await request.formData();
  } catch (error) {
    trackEvent(MarketplaceEvents.IMAGE_UPLOAD_ERROR, {
      userId: profile.userId,
      reason: "invalid_form_data",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json(
      { error: "Kunne ikke lese filopplastingen. Prøv igjen." },
      { status: 400 },
    );
  }

  const purpose = getUploadPurpose(formData.get("purpose"));
  const files = formData.getAll("file").filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    trackEvent(MarketplaceEvents.IMAGE_UPLOAD_ERROR, {
      userId: profile.userId,
      purpose,
      reason: "missing_file",
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json({ error: "Ingen fil ble sendt inn." }, { status: 400 });
  }

  if (files.length > MAX_FILES_PER_UPLOAD) {
    trackEvent(MarketplaceEvents.IMAGE_UPLOAD_ERROR, {
      userId: profile.userId,
      purpose,
      reason: "too_many_files",
      fileCount: files.length,
      durationMs: Date.now() - startedAt,
    });
    return NextResponse.json(
      { error: `Du kan laste opp maks ${MAX_FILES_PER_UPLOAD} bilder om gangen.` },
      { status: 400 },
    );
  }

  trackEvent(MarketplaceEvents.IMAGE_UPLOAD_STARTED, {
    userId: profile.userId,
    purpose,
    fileCount: files.length,
    totalBytes: files.reduce((sum, file) => sum + file.size, 0),
    durationMs: Date.now() - startedAt,
  });

  try {
    const uploads = [];

    for (const file of files) {
      const validationError = validateImageFile(file);
      if (validationError) {
        trackEvent(MarketplaceEvents.IMAGE_UPLOAD_ERROR, {
          userId: profile.userId,
          purpose,
          reason: "validation_failed",
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          durationMs: Date.now() - startedAt,
        });
        return NextResponse.json({ error: validationError }, { status: 400 });
      }

      uploads.push(await uploadImageToBlob(file, profile.userId, purpose));
    }

    trackEvent(MarketplaceEvents.IMAGE_UPLOADED, {
      userId: profile.userId,
      purpose,
      fileCount: uploads.length,
      totalBytes: uploads.reduce((sum, upload) => sum + upload.size, 0),
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({ uploads });
  } catch (error) {
    trackEvent(MarketplaceEvents.IMAGE_UPLOAD_ERROR, {
      userId: profile.userId,
      purpose,
      reason: "blob_upload_failed",
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Kunne ikke laste opp bildet. Prøv igjen." },
      { status: 500 },
    );
  }
}
