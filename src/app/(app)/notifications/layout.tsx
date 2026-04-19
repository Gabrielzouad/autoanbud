import type { ReactNode } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Car, PlusCircle, LayoutDashboard, FileTextIcon } from 'lucide-react';
import { UserDropdown } from '@/components/UserDropdown';

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import NotificationBell from '@/components/NotificationBell';

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

  const displayName =
    stackUser.displayName ||
    stackUser.primaryEmail ||
    stackUser.id.slice(0, 6) ||
    'Bruker';
  const email = stackUser.primaryEmail ?? 'Ingen e-post';

  return (
    <main className='min-h-screen bg-stone-50'>
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
              {profile.role === 'dealer' ? (
                <>
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
                </>
              ) : (
                <>
                  <Link
                    href='/buyer/requests'
                    className='flex items-center gap-2 text-stone-600 hover:text-emerald-700 transition-colors'
                  >
                    <Car className='h-4 w-4' />
                    Mine forespørsler
                  </Link>
                  <Link
                    href='/buyer/requests/new'
                    className='flex items-center gap-2 text-stone-600 hover:text-emerald-700 transition-colors'
                  >
                    <PlusCircle className='h-4 w-4' />
                    Ny forespørsel
                  </Link>
                </>
              )}
            </nav>
          </div>

          <div className='flex items-center gap-4'>
            <NotificationBell />
            {dealership ? (
              <UserDropdown
                displayName={dealership.name}
                displaySubtitle={dealership.city ?? ''}
                avatarFallback={dealership.name[0]}
                avatarClassName='bg-emerald-100 text-emerald-700 border-emerald-200'
              />
            ) : (
              <UserDropdown displayName={displayName} displaySubtitle={email} />
            )}
          </div>
        </div>
      </header>

      <div className='mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8'>
        {children}
      </div>
    </main>
  );
}
