// app/dealer/(dashboard)/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/user-menu';
import { Bell, Car, FileTextIcon, LayoutDashboard } from 'lucide-react';

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
            <Button
              variant='ghost'
              size='icon'
              className='text-stone-500 hover:text-stone-900'
            >
              <Bell className='h-5 w-5' />
              <span className='sr-only'>Notifications</span>
            </Button>
            <div className='hidden md:block pl-4 border-l border-stone-200'>
              <UserMenu
                primaryLabel={dealership.name}
                secondaryLabel={!dealership.city ? 'Ingen by' : dealership.city}
                avatar={
                  <span className='font-serif font-bold text-emerald-700'>
                    {dealership.name[0]}
                  </span>
                }
              />
            </div>
          </div>
        </div>
      </header>

      <div className='max-w-5xl mx-auto px-4 py-6'>{children}</div>
    </main>
  );
}
