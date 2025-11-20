// app/dealer/(dashboard)/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';

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
  const dealerships = await getDealershipsForUser(profile.userId);

  // ❗ If user has no dealership, send them to onboarding
  if (dealerships.length === 0) {
    redirect('/dealer/onboarding');
  }

  const dealership = dealerships[0];

  return (
    <main className='min-h-screen bg-slate-50'>
      <header className='border-b bg-white'>
        <div className='max-w-5xl mx-auto px-4 py-3 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link href='/' className='font-semibold'>
              AutoAnbud
            </Link>
            <nav className='flex items-center gap-4 text-sm text-muted-foreground'>
              <Link href='/dealer/requests'>Buyer requests</Link>
              <Link href='/dealer/offers'>My offers</Link>
            </nav>
          </div>
          <div className='text-xs text-muted-foreground text-right'>
            <div>{dealership.name}</div>
            <div>{dealership.city ?? ''}</div>
          </div>
        </div>
      </header>

      <div className='max-w-5xl mx-auto px-4 py-6'>{children}</div>
    </main>
  );
}
