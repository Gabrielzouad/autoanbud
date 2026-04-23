'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CarFront, Home, RefreshCw, AlertTriangle, ShieldAlert, SearchX, Ban } from 'lucide-react';

type ErrorCode = 'NOT_FOUND' | 'UNAUTHORIZED' | 'FORBIDDEN' | 'CONFLICT' | 'VALIDATION';

const ERROR_CONFIG: Record<ErrorCode, { icon: React.ReactNode; title: string; color: string }> = {
  NOT_FOUND: {
    icon: <SearchX className='w-16 h-16 text-stone-400' />,
    title: 'Ikke funnet',
    color: 'bg-stone-100',
  },
  UNAUTHORIZED: {
    icon: <ShieldAlert className='w-16 h-16 text-amber-500' />,
    title: 'Ikke tilgang',
    color: 'bg-amber-50',
  },
  FORBIDDEN: {
    icon: <Ban className='w-16 h-16 text-orange-500' />,
    title: 'Ingen tilgang',
    color: 'bg-orange-50',
  },
  CONFLICT: {
    icon: <AlertTriangle className='w-16 h-16 text-yellow-500' />,
    title: 'Konflikt',
    color: 'bg-yellow-50',
  },
  VALIDATION: {
    icon: <AlertTriangle className='w-16 h-16 text-red-500' />,
    title: 'Ugyldig data',
    color: 'bg-red-50',
  },
};

const DEFAULT_CONFIG = {
  icon: <AlertTriangle className='w-16 h-16 text-red-500' />,
  title: 'Noe gikk galt',
  color: 'bg-red-100',
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string; name?: string; code?: ErrorCode };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const isAppError = error.name === 'AppError';
  const config = isAppError && error.code
    ? (ERROR_CONFIG[error.code] ?? DEFAULT_CONFIG)
    : DEFAULT_CONFIG;

  const message = isAppError
    ? error.message
    : 'Beklager, det oppstod en uventet feil. Vennligst prøv igjen eller gå tilbake til forsiden.';

  return (
    <div className='min-h-screen flex flex-col bg-stone-50'>
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

      <main className='flex-1 flex items-center justify-center px-4'>
        <div className='max-w-md w-full text-center space-y-8'>
          <div className={`w-32 h-32 ${config.color} rounded-full flex items-center justify-center mx-auto`}>
            {config.icon}
          </div>

          <div className='space-y-4'>
            <h1 className='font-serif text-3xl md:text-4xl text-stone-900'>
              {config.title}
            </h1>
            <p className='text-stone-500 text-lg leading-relaxed'>{message}</p>
            {error.digest && (
              <p className='text-sm text-stone-400 font-mono bg-stone-100 px-3 py-2 rounded-lg inline-block'>
                Feilkode: {error.digest}
              </p>
            )}
          </div>

          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-4'>
            <Button
              onClick={reset}
              size='lg'
              className='rounded-full px-8 bg-emerald-900 hover:bg-emerald-800 text-white'
            >
              <RefreshCw className='w-4 h-4 mr-2' />
              Prøv igjen
            </Button>
            <Button asChild variant='outline' size='lg' className='rounded-full px-8 bg-white'>
              <Link href='/'>
                <Home className='w-4 h-4 mr-2' />
                Til forsiden
              </Link>
            </Button>
          </div>

          <p className='text-sm text-stone-400 pt-8'>
            Problemet vedvarer?{' '}
            <Link href='/' className='text-emerald-700 hover:underline'>
              Kontakt support
            </Link>
          </p>
        </div>
      </main>

      <footer className='border-t border-stone-200 py-6'>
        <div className='mx-auto max-w-7xl px-4 text-center text-sm text-stone-400'>
          © {new Date().getFullYear()} AutoAnbud AS. Alle rettigheter reservert.
        </div>
      </footer>
    </div>
  );
}
