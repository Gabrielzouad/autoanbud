'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='min-h-[60vh] flex items-center justify-center px-4'>
      <div className='text-center max-w-md'>
        <div className='flex justify-center mb-4'>
          <div className='h-12 w-12 rounded-full bg-red-100 flex items-center justify-center'>
            <AlertTriangle className='h-6 w-6 text-red-600' />
          </div>
        </div>
        <h2 className='font-serif text-xl font-semibold text-stone-900 mb-2'>
          Noe gikk galt
        </h2>
        <p className='text-sm text-stone-500 mb-6'>
          En uventet feil oppstod. Prøv igjen eller kontakt support hvis problemet vedvarer.
        </p>
        <Button onClick={reset} className='bg-emerald-900 hover:bg-emerald-800 text-white'>
          Prøv igjen
        </Button>
      </div>
    </div>
  );
}
