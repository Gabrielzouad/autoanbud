// src/app/(app)/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { stackServerApp } from '@/stack/server';
import { db, userProfiles } from '@/db';
import { eq } from 'drizzle-orm';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await stackServerApp.getUser();

  // Allow unauthenticated access (they'll be redirected by child layouts if needed)
  if (!user) {
    return <>{children}</>;
  }

  // Get user profile to check if role has been explicitly selected
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, user.id));

  // If profile doesn't exist, redirect to role selection
  if (!profile) {
    redirect('/select-role');
  }

  // If role is still the default "buyer" and profile was never updated after creation,
  // this means the user hasn't explicitly selected a role yet
  const hasNotSelectedRole =
    profile.role === 'buyer' &&
    profile.createdAt.getTime() === profile.updatedAt.getTime();

  if (hasNotSelectedRole) {
    redirect('/select-role');
  }

  return <>{children}</>;
}
