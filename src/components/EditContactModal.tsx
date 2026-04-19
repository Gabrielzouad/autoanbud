'use client';

import { useRef, useState } from 'react';
import { X } from 'lucide-react';

import { updateContactInfoAction } from '@/app/actions/dealerOnboarding';
import { Button } from '@/components/ui/button';

type Props = {
  dealershipId: string;
  current: {
    address?: string | null;
    city?: string | null;
    postalCode?: string | null;
    phone?: string | null;
    email?: string | null;
  };
};

export default function EditContactModal({ dealershipId, current }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await updateContactInfoAction(formData);
    setPending(false);
    if (result.success) {
      setOpen(false);
    } else {
      setError('Kunne ikke lagre. Prøv igjen.');
    }
  }

  return (
    <>
      <Button
        variant='outline'
        size='sm'
        className='w-full bg-transparent'
        onClick={() => setOpen(true)}
      >
        Rediger kontaktinfo
      </Button>

      {open && (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm'
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className='relative w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-xl'>
            <button
              onClick={() => setOpen(false)}
              className='absolute right-4 top-4 text-stone-400 hover:text-stone-700 transition-colors'
            >
              <X className='h-4 w-4' />
            </button>

            <h2 className='font-serif text-lg font-semibold text-stone-900 mb-5'>
              Rediger kontaktinfo
            </h2>

            <form
              ref={formRef}
              action={handleSubmit}
              className='space-y-4'
            >
              <input type='hidden' name='dealershipId' value={dealershipId} />

              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-stone-700'>Adresse</label>
                <input
                  name='address'
                  defaultValue={current.address ?? ''}
                  placeholder='Storgata 1'
                  className='w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600'
                />
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-stone-700'>Postnummer</label>
                  <input
                    name='postalCode'
                    defaultValue={current.postalCode ?? ''}
                    placeholder='0150'
                    className='w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600'
                  />
                </div>
                <div className='space-y-1.5'>
                  <label className='text-sm font-medium text-stone-700'>By</label>
                  <input
                    name='city'
                    defaultValue={current.city ?? ''}
                    placeholder='Oslo'
                    className='w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600'
                  />
                </div>
              </div>

              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-stone-700'>Telefon</label>
                <input
                  name='phone'
                  type='tel'
                  defaultValue={current.phone ?? ''}
                  placeholder='+47 123 45 678'
                  className='w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600'
                />
              </div>

              <div className='space-y-1.5'>
                <label className='text-sm font-medium text-stone-700'>E-post</label>
                <input
                  name='email'
                  type='email'
                  defaultValue={current.email ?? ''}
                  placeholder='kontakt@forhandler.no'
                  className='w-full rounded-md border border-stone-200 px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-600'
                />
              </div>

              {error && <p className='text-sm text-red-600'>{error}</p>}

              <div className='flex justify-end gap-3 pt-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setOpen(false)}
                >
                  Avbryt
                </Button>
                <Button
                  type='submit'
                  disabled={pending}
                  className='bg-emerald-900 hover:bg-emerald-800 text-white'
                >
                  {pending ? 'Lagrer...' : 'Lagre'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
