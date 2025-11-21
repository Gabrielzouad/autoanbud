// src/app/api/uploads/request-images/route.ts
import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const formData = await request.formData();
  const files = formData
    .getAll("file")
    .filter((entry): entry is File => entry instanceof File);

  if (!files.length) {
    return NextResponse.json(
      { error: "No files received" },
      { status: 400 },
    );
  }

  const oversizeFile = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);
  if (oversizeFile) {
    return NextResponse.json(
      { error: `${oversizeFile.name} exceeds 5MB limit` },
      { status: 413 },
    );
  }

  try {
    const uploads = await Promise.all(
      files.map(async (file) => {
        const extension = file.name.split(".").pop() ?? "bin";
        const uniqueName = `buyer-requests/${randomUUID()}.${extension}`;

        const blob = await put(uniqueName, file, {
          access: "public",
          contentType: file.type || "application/octet-stream",
        });

        return {
          url: blob.url,
          pathname: blob.pathname,
        };
      }),
    );

    return NextResponse.json({ uploads });
  } catch (error) {
    console.error("Blob upload failed", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 },
    );
  }
}
