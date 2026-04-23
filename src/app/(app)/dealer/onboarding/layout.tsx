import type { ReactNode } from 'react';
import Link from 'next/link';
import { CarFront } from 'lucide-react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <main className='min-h-screen bg-stone-50'>
      <header className='w-full border-b border-stone-200 bg-white/80 backdrop-blur-md'>
        <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center'>
          <Link
            href='/'
            className='flex items-center gap-2 font-serif text-xl font-bold tracking-tight text-stone-900'
          >
            <div className='w-8 h-8 bg-emerald-900 text-white rounded-full flex items-center justify-center'>
              <CarFront className='w-4 h-4' />
            </div>
            AutoAnbud
          </Link>
        </div>
      </header>
      <div className='mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8'>
        {children}
      </div>
    </main>
  );
}
