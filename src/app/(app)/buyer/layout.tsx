// src/app/buyer/layout.tsx
import type { ReactNode } from 'react';
import Link from 'next/link';
import { stackServerApp } from '@/stack/server';
import { Button } from '@/components/ui/button';

export default async function BuyerLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await stackServerApp.getUser();

  if (!user) {
    return (
      <main className='min-h-screen flex items-center justify-center bg-slate-50'>
        <div className='text-center space-y-4'>
          <h1 className='text-2xl font-semibold'>You must be signed in</h1>
          <p className='text-sm text-muted-foreground'>
            Please sign in to view your buyer dashboard.
          </p>
          <Button asChild>
            <Link href='/handler/sign-in'>Sign in</Link>
          </Button>
        </div>
      </main>
    );
  }

  const email = user.primaryEmail ?? 'No email';

  return (
    <main className='min-h-screen bg-slate-50'>
      <header className='border-b bg-white'>
        <div className='max-w-5xl mx-auto px-4 py-3 flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Link href='/' className='font-semibold'>
              AutoAnbud
            </Link>
            <nav className='flex items-center gap-4 text-sm text-muted-foreground'>
              <Link href='/buyer/requests'>My requests</Link>
              <Link href='/buyer/requests/new'>New request</Link>
            </nav>
          </div>
          <div className='flex items-center gap-3'>
            <span className='text-xs text-muted-foreground'>{email}</span>
          </div>
        </div>
      </header>

      <div className='max-w-5xl mx-auto px-4 py-6'>{children}</div>
    </main>
  );
}
