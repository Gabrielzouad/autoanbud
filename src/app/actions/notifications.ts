"use server";

import { redirect } from "next/navigation";

import { stackServerApp } from "@/stack/server";
import { ensureUserProfile } from "@/lib/services/userProfiles";
import { markNotificationsReadForUser, markNotificationReadById } from "@/lib/services/notifications";

export async function markAllNotificationsReadAction() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/handler/sign-in");
  }

  await ensureUserProfile({ id: user.id });
  await markNotificationsReadForUser(user.id);

  redirect("/notifications");
}

export async function markNotificationReadAction(formData: FormData) {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect("/handler/sign-in");
  }

  const notificationId = formData.get("notificationId") as string;
  const redirectTo = (formData.get("redirectTo") as string) || "/notifications";

  await markNotificationReadById(user.id, notificationId);
  redirect(redirectTo);
}
