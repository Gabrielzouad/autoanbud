// src/app/(app)/buyer/page.tsx

import Link from 'next/link';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { listBuyerRequestsForBuyer } from '@/lib/services/buyerRequests';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CarFront, PlusCircle } from 'lucide-react';

export default async function BuyerDashboardPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    // buyer layout should already guard, but safety:
    return null;
  }

  const profile = await ensureUserProfile({ id: user.id });
  const requests = await listBuyerRequestsForBuyer(profile.userId);

  const latest = requests.slice(0, 3);

  return (
    <div className='space-y-8'>
      {/* Header / hero */}
      <section className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-2'>
          <div className='inline-flex items-center gap-2 text-xs text-muted-foreground'>
            <CarFront className='w-4 h-4' />
            <span>Kjøperside</span>
          </div>
          <h1 className='text-2xl md:text-3xl font-semibold tracking-tight'>
            Hei{user.displayName ? `, ${user.displayName}` : ''}!{' '}
            <span className='text-muted-foreground font-normal'>
              Klar for å finne neste bil?
            </span>
          </h1>
          <p className='text-sm text-muted-foreground max-w-xl'>
            Opprett en forespørsel på bilen du ønsker deg, og få tilbud fra
            forhandlere som har biler på lager.
          </p>
        </div>

        <div className='flex gap-3'>
          <Button asChild size='sm' className='gap-2'>
            <Link href='/buyer/requests/new'>
              <PlusCircle className='w-4 h-4' />
              Ny forespørsel
            </Link>
          </Button>
          <Button asChild variant='outline' size='sm'>
            <Link href='/buyer/requests'>Se alle forespørsler</Link>
          </Button>
        </div>
      </section>

      {/* Latest requests */}
      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Dine siste forespørsler</h2>
          {requests.length > 0 && (
            <Button asChild variant='ghost' size='sm' className='text-xs'>
              <Link href='/buyer/requests'>Vis alle</Link>
            </Button>
          )}
        </div>

        {requests.length === 0 ? (
          <Card className='bg-white'>
            <CardContent className='p-5 text-sm text-muted-foreground space-y-3'>
              <p>Du har ikke opprettet noen forespørsler ennå.</p>
              <Button asChild size='sm'>
                <Link href='/buyer/requests/new'>
                  Lag din første forespørsel
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='space-y-3'>
            {latest.map((r) => (
              <Card
                key={r.id}
                className='bg-white hover:border-slate-400 transition'
              >
                <CardContent className='p-4 flex items-center justify-between gap-4'>
                  <div className='space-y-1'>
                    <div className='flex items-center gap-2'>
                      <Link
                        href={`/buyer/requests/${r.id}`}
                        className='text-sm font-medium hover:underline'
                      >
                        {r.title}
                      </Link>
                      <Badge
                        variant='outline'
                        className='text-[10px] uppercase tracking-wide'
                      >
                        {r.status}
                      </Badge>
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {r.make} {r.model}
                      {r.yearFrom && <> · {r.yearFrom}+</>}
                      {r.locationCity && <> · {r.locationCity}</>}
                    </div>
                  </div>

                  <div className='text-right text-xs text-muted-foreground space-y-1'>
                    {r.budgetMax && (
                      <div className='text-sm font-semibold text-foreground'>
                        Maks{' '}
                        {r.budgetMax.toLocaleString('nb-NO', {
                          style: 'currency',
                          currency: 'NOK',
                          maximumFractionDigits: 0,
                        })}
                      </div>
                    )}
                    <Link
                      href={`/buyer/requests/${r.id}`}
                      className='text-xs text-primary hover:underline'
                    >
                      Se detaljer
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
