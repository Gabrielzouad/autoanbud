import Link from 'next/link';
import { UserButton } from '@stackframe/stack';
import { Car, FileTextIcon, LayoutDashboard, PlusCircle } from 'lucide-react';

import NotificationBell from '@/components/NotificationBell';

type AuthenticatedAppHeaderProps = {
  role: 'buyer' | 'dealer' | 'admin';
  dealership?: {
    name: string;
    city?: string | null;
  } | null;
};

export function AuthenticatedAppHeader({
  role,
  dealership,
}: AuthenticatedAppHeaderProps) {
  const isDealer = role === 'dealer';

  return (
    <header className='sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-8'>
          <Link
            href='/'
            className='font-serif text-xl font-bold tracking-tight text-stone-900'
          >
            AutoAnbud
          </Link>
          <nav className='hidden items-center gap-6 text-sm font-medium md:flex'>
            {isDealer ? (
              <>
                <Link
                  href='/dealer'
                  className='flex items-center gap-2 text-stone-600 transition-colors hover:text-emerald-700'
                >
                  <LayoutDashboard className='h-4 w-4' />
                  Dashboard
                </Link>
                <Link
                  href='/dealer/requests'
                  className='flex items-center gap-2 text-stone-600 transition-colors hover:text-emerald-700'
                >
                  <Car className='h-4 w-4' />
                  Kjøper forespørsler
                </Link>
                <Link
                  href='/dealer/offers'
                  className='flex items-center gap-2 text-stone-600 transition-colors hover:text-emerald-700'
                >
                  <FileTextIcon className='h-4 w-4' />
                  Sendte tilbud
                </Link>
              </>
            ) : (
              <>
                <Link
                  href='/buyer/requests'
                  className='flex items-center gap-2 text-stone-600 transition-colors hover:text-emerald-700'
                >
                  <Car className='h-4 w-4' />
                  Mine forespørsler
                </Link>
                <Link
                  href='/buyer/requests/new'
                  className='flex items-center gap-2 text-stone-600 transition-colors hover:text-emerald-700'
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
            <div className='hidden flex-col items-end md:flex'>
              <div className='text-sm font-medium text-stone-900'>
                {dealership.name}
              </div>
              <div className='text-xs text-stone-500'>
                {dealership.city ?? 'Forhandler'}
              </div>
            </div>
          ) : null}
          <UserButton showUserInfo={!dealership} />
        </div>
      </div>
    </header>
  );
}
