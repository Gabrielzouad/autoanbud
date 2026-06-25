// src/app/(app)/buyer/requests/new/page.tsx

import { redirect } from 'next/navigation';
import { RequestForm } from './request-form';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { createBuyerRequestFormAction } from '@/app/actions/buyerRequests';

export default async function NewRequestPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect('/handler/sign-in');
  }

  await ensureUserProfile({ id: user.id });

  return (
    <div className='min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-3xl mx-auto space-y-8'>
        <div className='text-center space-y-2'>
          <h1 className='text-3xl font-bold font-serif text-stone-900'>
            Opprett ny forespørsel
          </h1>
          <p className='text-stone-600 max-w-lg mx-auto'>
            Fortell hva du er ute etter, så lar vi verifiserte forhandlere komme
            til deg med konkrete tilbud.
          </p>
        </div>

        <RequestForm action={createBuyerRequestFormAction} />
      </div>
    </div>
  );
}
