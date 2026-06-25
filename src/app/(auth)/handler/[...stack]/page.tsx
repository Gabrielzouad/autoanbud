import { StackHandler } from '@stackframe/stack';
import { eq } from 'drizzle-orm';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

import { db, userProfiles } from '@/db';
import { AuthenticatedAppHeader } from '@/components/AuthenticatedAppHeader';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { isEmailVerificationRequired } from '@/lib/auth/emailVerification';
import { stackServerApp } from '@/stack/server';

type HandlerProps = {
  params: Promise<{ stack?: string[] }>;
};

const stackComponentProps = {
  SignIn: {
    firstTab: 'password' as const,
    automaticRedirect: true,
    extraInfo: (
      <p className='text-center text-sm text-stone-600'>
        Ny på AutoAnbud?{' '}
        <Link
          href='/handler/sign-up'
          className='font-medium text-emerald-800 underline underline-offset-4'
        >
          Opprett konto
        </Link>
      </p>
    ),
  },
  SignUp: {
    firstTab: 'password' as const,
    automaticRedirect: true,
    extraInfo: (
      <div className='space-y-2 text-center text-sm text-stone-600'>
        <p>
          Etter registrering velger du om kontoen skal brukes som kjøper eller
          forhandler.
        </p>
        <p>
          Har du allerede konto?{' '}
          <Link
            href='/handler/sign-in'
            className='font-medium text-emerald-800 underline underline-offset-4'
          >
            Logg inn
          </Link>
        </p>
      </div>
    ),
  },
};

export default async function Handler({ params }: HandlerProps) {
  const { stack = [] } = await params;
  const isAccountSettings = stack[0] === 'account-settings';

  if (isAccountSettings) {
    const user = await stackServerApp.getUser();

    if (!user) {
      redirect('/handler/sign-in');
    }

    if (isEmailVerificationRequired(user)) {
      redirect('/verify-email');
    }

    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id));

    if (!profile) {
      redirect('/select-role');
    }

    const hasNotSelectedRole =
      profile.role === 'buyer' &&
      profile.createdAt.getTime() === profile.updatedAt.getTime();

    if (hasNotSelectedRole) {
      redirect('/select-role');
    }

    const dealership =
      profile.role === 'dealer'
        ? (await getDealershipsForUser(profile.userId))[0] ?? null
        : null;

    return (
      <main className='min-h-screen bg-stone-50'>
        <AuthenticatedAppHeader role={profile.role} dealership={dealership} />

        <div className='mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8'>
          <div className='mb-6'>
            <p className='text-sm font-medium uppercase tracking-wide text-emerald-700'>
              Konto
            </p>
            <h1 className='mt-2 font-serif text-3xl font-semibold tracking-tight text-stone-950'>
              Kontoinnstillinger
            </h1>
            <p className='mt-2 max-w-2xl text-sm leading-6 text-stone-600'>
              Administrer innlogging, e-post, sikkerhet og aktive økter.
            </p>
          </div>

          <section className='rounded-lg border border-stone-200 bg-white p-4 shadow-sm sm:p-6'>
            <Suspense fallback={null}>
              <StackHandler
                fullPage={false}
                componentProps={{
                  ...stackComponentProps,
                  AccountSettings: {
                    fullPage: false,
                  },
                }}
              />
            </Suspense>
          </section>
        </div>
      </main>
    );
  }

  return (
    <Suspense fallback={null}>
      <StackHandler
        fullPage
        componentProps={stackComponentProps}
      />
    </Suspense>
  );
}
