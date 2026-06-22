// app/dealer/(dashboard)/layout.tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { AuthenticatedAppHeader } from '@/components/AuthenticatedAppHeader';

export default async function DealerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect('/handler/sign-in');
  }

  const profile = await ensureUserProfile({ id: user.id });

  // Buyers have no business in the dealer dashboard
  if (profile.role === 'buyer') {
    redirect('/buyer/requests');
  }

  const dealerships = await getDealershipsForUser(profile.userId);

  // Dealer without a dealership → onboarding (now outside this layout, no loop)
  if (dealerships.length === 0) {
    redirect('/dealer/onboarding');
  }

  const dealership = dealerships[0];

  return (
    <main className='min-h-screen bg-slate-50'>
      <AuthenticatedAppHeader role='dealer' dealership={dealership} />

      <div className='max-w-5xl mx-auto px-4 py-6'>{children}</div>
    </main>
  );
}
