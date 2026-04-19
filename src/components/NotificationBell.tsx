import Link from "next/link";
import { Bell } from "lucide-react";

import { stackServerApp } from "@/stack/server";
import { countUnreadNotificationsForUser } from "@/lib/services/notifications";

export default async function NotificationBell() {
  const user = await stackServerApp.getUser();
  if (!user) return null;

  const unreadCount = await countUnreadNotificationsForUser(user.id);

  return (
    <Link
      href="/notifications"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:text-stone-900"
    >
      <Bell className="h-5 w-5" />
      <span className="sr-only">Varsler</span>
      {unreadCount > 0 ? (
        <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-semibold text-white">
          {unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
