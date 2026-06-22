import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { isEmailVerificationRequired } from '@/lib/auth/emailVerification';
import { stackServerApp } from '@/stack/server';
import { VerifyEmailResendForm } from './VerifyEmailResendForm';

export default async function VerifyEmailPage() {
  const user = await stackServerApp.getUser();

  if (!user) {
    redirect('/handler/sign-in');
  }

  if (!isEmailVerificationRequired(user)) {
    redirect('/select-role');
  }

  return (
    <main className='min-h-screen bg-stone-50 px-4 py-16'>
      <div className='mx-auto max-w-md rounded-lg border border-stone-200 bg-white p-8 shadow-sm'>
        <div className='mb-6 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700'>
          <MailCheck className='h-6 w-6' />
        </div>

        <div className='space-y-3'>
          <h1 className='font-serif text-2xl font-semibold text-stone-900'>
            Bekreft e-posten din
          </h1>
          <p className='text-sm leading-6 text-stone-600'>
            Sjekk innboksen for{' '}
            <span className='font-medium text-stone-900'>
              {user.primaryEmail}
            </span>
            , eller send en ny bekreftelseslenke. Bekreft e-posten før du
            fortsetter.
          </p>
        </div>

        <div className='mt-8 space-y-3'>
          <VerifyEmailResendForm />
          <Button asChild variant='outline' className='w-full bg-white'>
            <Link href='/handler/sign-out'>Logg ut</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
