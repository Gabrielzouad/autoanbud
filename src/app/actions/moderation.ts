"use server";

import { revalidatePath } from "next/cache";

import {
  flagEntity,
  reviewFlaggedItem,
} from "@/lib/services/moderation";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { stackServerApp } from "@/stack/server";
import { verifyAdminUser } from "@/lib/services/authorization";

async function requireAdminProfile() {
  const user = await stackServerApp.getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const profile = await ensureUserProfile({ id: user.id });
  await verifyAdminUser(profile.userId);
  return profile;
}

export async function createModerationFlagAction(formData: FormData) {
  const profile = await requireAdminProfile();

  await flagEntity({
    entityType: String(formData.get("entityType") ?? ""),
    entityId: String(formData.get("entityId") ?? ""),
    reason: String(formData.get("reason") ?? ""),
    reporterId: profile.userId,
  });

  revalidatePath("/admin/moderation");
}

export async function updateModerationFlagStatusAction(formData: FormData) {
  const profile = await requireAdminProfile();

  await reviewFlaggedItem({
    adminUserId: profile.userId,
    flagId: String(formData.get("flagId") ?? ""),
    status: String(formData.get("status") ?? ""),
    notes: String(formData.get("notes") ?? ""),
  });

  revalidatePath("/admin/moderation");
}
