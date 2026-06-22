import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AuthenticatedAppHeader } from '@/components/AuthenticatedAppHeader';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';

export default async function NotificationsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const stackUser = await stackServerApp.getUser();
  if (!stackUser) {
    redirect('/handler/sign-in');
  }

  const profile = await ensureUserProfile({ id: stackUser.id });

  const dealership =
    profile.role === 'dealer'
      ? (await getDealershipsForUser(profile.userId))[0] ?? null
      : null;

  return (
    <main className='min-h-screen bg-stone-50'>
      <AuthenticatedAppHeader role={profile.role} dealership={dealership} />

      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {children}
      </div>
    </main>
  );
}
