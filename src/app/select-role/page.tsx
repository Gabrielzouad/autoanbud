'use client';

import { useState, useTransition } from 'react';
import { Car, Building2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { selectRoleAction } from '@/app/actions/roleSelection';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SelectRolePage() {
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'dealer' | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    if (!selectedRole) return;

    startTransition(async () => {
      const result = await selectRoleAction(selectedRole);

      if (!result.success) {
        setError(result.error);
        toast.error('Kunne ikke lagre rolle', {
          description: result.error,
        });
      } else {
        toast.success('Rolle lagret', {
          description:
            selectedRole === 'buyer'
              ? 'Du fortsetter som kjøper.'
              : 'Du fortsetter som forhandler.',
        });
        window.location.href = result.redirectTo;
      }
    });
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-emerald-50 via-stone-50 to-emerald-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-4xl space-y-8'>
        <div className='text-center space-y-2'>
          <h1 className='text-4xl font-bold font-serif text-stone-900'>
            Velkommen til AutoAnbud
          </h1>
          <p className='text-lg text-stone-600'>
            Velg hvordan du vil bruke plattformen
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'buyer'
                ? 'ring-2 ring-emerald-700 shadow-lg scale-[1.02]'
                : 'hover:border-emerald-200'
            }`}
            onClick={() => setSelectedRole('buyer')}
          >
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center'>
                  <Car className='h-6 w-6 text-emerald-700' />
                </div>
                {selectedRole === 'buyer' && (
                  <CheckCircle2 className='h-6 w-6 text-emerald-700' />
                )}
              </div>
              <CardTitle className='text-2xl'>Jeg er kjøper</CardTitle>
              <CardDescription className='text-base'>
                Jeg leter etter bil og vil motta tilbud fra forhandlere
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <ul className='space-y-2 text-sm text-stone-600'>
                <li className='flex items-start gap-2'>
                  <span className='text-emerald-600 mt-0.5'>•</span>
                  <span>Opprett forespørsler om biler du ønsker</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-emerald-600 mt-0.5'>•</span>
                  <span>Motta tilbud fra verifiserte forhandlere</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-emerald-600 mt-0.5'>•</span>
                  <span>Sammenlign priser og velg beste tilbud</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-emerald-600 mt-0.5'>•</span>
                  <span>Chat direkte med forhandlere</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedRole === 'dealer'
                ? 'ring-2 ring-blue-700 shadow-lg scale-[1.02]'
                : 'hover:border-blue-200'
            }`}
            onClick={() => setSelectedRole('dealer')}
          >
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div className='h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center'>
                  <Building2 className='h-6 w-6 text-blue-700' />
                </div>
                {selectedRole === 'dealer' && (
                  <CheckCircle2 className='h-6 w-6 text-blue-700' />
                )}
              </div>
              <CardTitle className='text-2xl'>Jeg er forhandler</CardTitle>
              <CardDescription className='text-base'>
                Jeg representerer en bilforhandler og vil sende tilbud
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-3'>
              <ul className='space-y-2 text-sm text-stone-600'>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 mt-0.5'>•</span>
                  <span>Se kjøperes forespørsler i sanntid</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 mt-0.5'>•</span>
                  <span>Send målrettede tilbud til potensielle kunder</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 mt-0.5'>•</span>
                  <span>Administrer forhandlerens profil og tilbud</span>
                </li>
                <li className='flex items-start gap-2'>
                  <span className='text-blue-600 mt-0.5'>•</span>
                  <span>Chat direkte med kjøpere</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className='flex flex-col items-center gap-4'>
          <Button
            size='lg'
            disabled={!selectedRole || isPending}
            onClick={handleSubmit}
            className='w-full md:w-auto min-w-[240px] bg-emerald-900 hover:bg-emerald-800 text-white text-lg py-6'
          >
            {isPending ? 'Lagrer...' : 'Fortsett'}
          </Button>

          {error && (
            <p className='text-sm text-red-600 bg-red-50 px-4 py-2 rounded-md border border-red-200'>
              {error}
            </p>
          )}

          <p className='text-xs text-stone-500 text-center max-w-md'>
            <strong>Viktig:</strong> Du kan ikke endre rolle senere. Velg den
            som passer best for deg.
          </p>
        </div>
      </div>
    </div>
  );
}
