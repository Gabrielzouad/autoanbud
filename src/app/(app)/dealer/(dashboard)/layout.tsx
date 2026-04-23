// app/dealer/(dashboard)/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { Car, FileTextIcon, LayoutDashboard } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';
import { UserDropdown } from '@/components/UserDropdown';

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
      <header className='sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-8'>
            <Link
              href='/'
              className='font-serif text-xl font-bold tracking-tight text-stone-900'
            >
              AutoAnbud
            </Link>
            <nav className='hidden md:flex items-center gap-6 text-sm font-medium'>
              <Link
                href='/dealer'
                className='flex items-center gap-2 text-stone-600 hover:text-emerald-700 transition-colors'
              >
                <LayoutDashboard className='h-4 w-4' />
                Dashboard
              </Link>
              <Link
                href='/dealer/requests'
                className='flex items-center gap-2 text-stone-600 hover:text-emerald-700 transition-colors'
              >
                <Car className='h-4 w-4' />
                Kjøper forespørsler
              </Link>
              <Link
                href='/dealer/offers'
                className='flex items-center gap-2 text-stone-600 hover:text-emerald-700 transition-colors'
              >
                <FileTextIcon className='h-4 w-4' />
                Sendte tilbud
              </Link>
            </nav>
          </div>

          <div className='flex items-center gap-4'>
            <NotificationBell />
            <UserDropdown
              displayName={dealership.name}
              displaySubtitle={dealership.city ?? ''}
              avatarFallback={dealership.name[0]}
              avatarClassName='bg-emerald-100 text-emerald-700 border-emerald-200'
            />
          </div>
        </div>
      </header>

      <div className='max-w-5xl mx-auto px-4 py-6'>{children}</div>
    </main>
  );
}
