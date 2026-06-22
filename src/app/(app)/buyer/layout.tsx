// src/app/(app)/buyer/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AuthenticatedAppHeader } from '@/components/AuthenticatedAppHeader';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';

export default async function BuyerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const stackUser = await stackServerApp.getUser();
  if (!stackUser) {
    // Ingen innlogget bruker – send til innlogging
    redirect('/handler/sign-in');
  }

  const profile = await ensureUserProfile({ id: stackUser.id });

  if (profile.role === 'dealer') {
    redirect('/dealer');
  }

  return (
    <main className='min-h-screen bg-stone-50'>
      <AuthenticatedAppHeader role='buyer' />

      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {children}
      </div>
    </main>
  );
}
