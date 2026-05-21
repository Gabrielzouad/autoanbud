import { put } from "@vercel/blob";

export const IMAGE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_UPLOAD_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ImageUploadPurpose = "request" | "trade_in" | "offer";

export type UploadedImageBlob = {
  url: string;
  pathname: string;
  contentType: string;
  size: number;
};

export function validateImageFile(file: File) {
  if (!IMAGE_UPLOAD_ALLOWED_TYPES.includes(file.type as (typeof IMAGE_UPLOAD_ALLOWED_TYPES)[number])) {
    return "Kun JPG, PNG og WebP-bilder er tillatt.";
  }

  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    return "Bildet kan ikke være større enn 5 MB.";
  }

  return null;
}

export async function uploadImageToBlob(
  file: File,
  userId: string,
  purpose: ImageUploadPurpose,
): Promise<UploadedImageBlob> {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const pathname = `uploads/${purpose}/${userId}/${crypto.randomUUID()}.${extension}`;
  const blob = await put(pathname, file, {
    access: "public",
    contentType: file.type,
    addRandomSuffix: false,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: file.type,
    size: file.size,
  };
}
