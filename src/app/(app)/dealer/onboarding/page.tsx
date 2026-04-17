// src/app/dealer/onboarding/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { LayoutDashboard, Car, FileTextIcon, Bell } from 'lucide-react';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { getDealerCapability } from '@/lib/services/dealerCapabilities';
import { DealerOnboardingForm } from './DealerOnboardingForm';

export default async function DealerOnboardingPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect('/handler/sign-in');
  }

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);
  const dealership = dealerships[0] ?? null;

  if (dealership) {
    const capabilities = await getDealerCapability(dealership.id);
    return (
      <div className='min-h-screen bg-stone-50/50'>
        <header className='sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md'>
          <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center gap-8'>
              <Link
                href='/dealer'
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
                  Oversikt
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
              <button className='inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:text-stone-900'>
                <Bell className='h-5 w-5' />
                <span className='sr-only'>Varsler</span>
              </button>
            </div>
          </div>
        </header>
        <div className='px-4 py-6 sm:px-6 lg:px-8'>
          <div className='max-w-7xl mx-auto'>
            <div className='max-w-4xl mx-auto bg-white border rounded-lg shadow-sm p-6'>
              <DealerOnboardingForm
                dealership={dealership}
                initialCapabilities={capabilities}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-stone-50/50'>
      <header className='sticky top-0 z-50 w-full border-b border-stone-200 bg-white/80 backdrop-blur-md'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center gap-8'>
            <Link
              href='/dealer'
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
                Oversikt
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
            <button className='inline-flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 text-stone-500 hover:text-stone-900'>
              <Bell className='h-5 w-5' />
              <span className='sr-only'>Varsler</span>
            </button>
          </div>
        </div>
      </header>
      <div className='px-4 py-6 sm:px-6 lg:px-8'>
        <div className='max-w-7xl mx-auto'>
          <div className='max-w-4xl mx-auto bg-white border rounded-lg shadow-sm p-6'>
            <DealerOnboardingForm />
          </div>
        </div>
      </div>
    </div>
  );
}
