'use client';

import { useState, useTransition } from 'react';
import { MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { resendVerificationEmailAction } from './actions';

export function VerifyEmailResendForm() {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className='space-y-3'>
      <Button
        type='button'
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            setStatus(null);
            setError(null);
            const result = await resendVerificationEmailAction();
            if (result.success) {
              setStatus(result.message);
            } else {
              setError(result.error);
            }
          });
        }}
        className='w-full bg-emerald-900 text-white hover:bg-emerald-800'
      >
        <MailCheck className='h-4 w-4' />
        {isPending ? 'Sender...' : 'Send bekreftelseslenke på nytt'}
      </Button>
      {status ? <p className='text-sm text-emerald-700'>{status}</p> : null}
      {error ? <p className='text-sm text-red-600'>{error}</p> : null}
    </div>
  );
}
