// src/app/(app)/buyer/page.tsx

import Link from 'next/link';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { listBuyerRequestsForBuyer } from '@/lib/services/buyerRequests';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  CarFront,
  Clock,
  MapPin,
  MessageSquare,
  PlusCircle,
  Search,
  TrendingUp,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default async function BuyerDashboardPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    // buyer layout should already guard, but safety:
    return null;
  }

  const profile = await ensureUserProfile({ id: user.id });
  const requests = await listBuyerRequestsForBuyer(profile.userId);

  const activeRequests = requests.filter((r) => r.status === 'open').length;
  const totalOffers = requests.length;

  const latest = requests.slice(0, 3);

  return (
    <div className='space-y-8'>
      <section className='relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-900 to-stone-800 p-8 md:p-12 text-white'>
        <div className='absolute inset-0 bg-[url("/luxury-car-interior-minimalist.jpg")] opacity-10 bg-cover bg-center' />
        <div className='relative z-10 max-w-2xl space-y-4'>
          <div className='inline-flex items-center gap-2 rounded-full bg-emerald-600/20 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-sm'>
            <CarFront className='w-3 h-3' />
            <span>Kjøperpanel</span>
          </div>
          <h1 className='font-serif text-3xl md:text-4xl font-bold tracking-tight'>
            Velkommen tilbake{user.displayName ? `, ${user.displayName}` : ''}!
          </h1>
          <p className='text-stone-300 leading-relaxed'>
            Opprett en forespørsel på bilen du ønsker deg, og la profesjonelle
            forhandlere komme til deg med skreddersydde tilbud.
          </p>
          <div className='flex flex-wrap gap-3 pt-2'>
            <Button
              asChild
              size='lg'
              className='bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg'
            >
              <Link href='/buyer/requests/new'>
                <PlusCircle className='w-4 h-4 mr-2' />
                Opprett forespørsel
              </Link>
            </Button>
            <Button
              asChild
              variant='outline'
              size='lg'
              className='bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-sm'
            >
              <Link href='/buyer/requests'>
                Se alle forespørsler
                <ArrowRight className='w-4 h-4 ml-2' />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className='grid gap-4 md:grid-cols-3'>
        <Card className='bg-white border-stone-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-sm text-stone-500 font-medium'>
                  Aktive forespørsler
                </p>
                <p className='text-3xl font-bold font-serif text-stone-900'>
                  {activeRequests}
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center'>
                <Search className='w-6 h-6 text-emerald-700' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white border-stone-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-sm text-stone-500 font-medium'>
                  Tilbud mottatt
                </p>
                <p className='text-3xl font-bold font-serif text-stone-900'>
                  {totalOffers}
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center'>
                <MessageSquare className='w-6 h-6 text-blue-700' />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white border-stone-200'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between'>
              <div className='space-y-1'>
                <p className='text-sm text-stone-500 font-medium'>
                  Gjennomsnittlig respons
                </p>
                <p className='text-3xl font-bold font-serif text-stone-900'>
                  2.4 d
                </p>
              </div>
              <div className='h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center'>
                <Clock className='w-6 h-6 text-amber-700' />
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className='bg-stone-100 rounded-xl p-6 md:p-8'>
        <div className='mb-6'>
          <h2 className='font-serif text-2xl font-bold text-stone-900 mb-2'>
            Slik fungerer det
          </h2>
          <p className='text-stone-600'>Tre enkle steg til din neste bil</p>
        </div>

        <div className='grid gap-6 md:grid-cols-3'>
          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold'>
                1
              </div>
              <h3 className='font-semibold text-stone-900'>
                Beskriv bilen du vil ha
              </h3>
            </div>
            <p className='text-sm text-stone-600 leading-relaxed ml-12'>
              Fortell oss om merke, modell, budsjett og preferanser. Du kan også
              laste opp bilder.
            </p>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold'>
                2
              </div>
              <h3 className='font-semibold text-stone-900'>
                Motta tilbud fra forhandlere
              </h3>
            </div>
            <p className='text-sm text-stone-600 leading-relaxed ml-12'>
              Verifiserte forhandlere sender deg tilbud på biler som matcher
              dine kriterier.
            </p>
          </div>

          <div className='space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white font-bold'>
                3
              </div>
              <h3 className='font-semibold text-stone-900'>
                Velg beste tilbud
              </h3>
            </div>
            <p className='text-sm text-stone-600 leading-relaxed ml-12'>
              Sammenlign tilbud, kontakt forhandlere direkte, og kjøp bilen som
              passer best.
            </p>
          </div>
        </div>
      </section>

      <section className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='font-serif text-2xl font-bold text-stone-900'>
              Dine siste forespørsler
            </h2>
            <p className='text-sm text-stone-500 mt-1'>
              Følg med på status og tilbud
            </p>
          </div>
          {requests.length > 3 && (
            <Button
              asChild
              variant='ghost'
              size='sm'
              className='text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50'
            >
              <Link href='/buyer/requests'>
                Se alle
                <ArrowRight className='w-4 h-4 ml-2' />
              </Link>
            </Button>
          )}
        </div>

        {requests.length === 0 ? (
          <Card className='bg-gradient-to-br from-white to-stone-50 border-2 border-dashed border-stone-200'>
            <CardContent className='p-12 text-center space-y-4'>
              <div className='mx-auto w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center'>
                <CarFront className='w-8 h-8 text-stone-400' />
              </div>
              <div className='space-y-2'>
                <h3 className='font-serif text-xl font-semibold text-stone-900'>
                  Ingen forespørsler ennå
                </h3>
                <p className='text-stone-500 max-w-md mx-auto'>
                  Kom i gang ved å opprette din første forespørsel. Det tar bare
                  noen få minutter.
                </p>
              </div>
              <Button
                asChild
                size='lg'
                className='bg-emerald-600 hover:bg-emerald-700 mt-4'
              >
                <Link href='/buyer/requests/new'>
                  <PlusCircle className='w-4 h-4 mr-2' />
                  Opprett din første forespørsel
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
            {latest.map((r) => (
              <Link
                key={r.id}
                href={`/buyer/requests/${r.id}`}
                className='group'
              >
                <Card className='bg-white hover:border-emerald-300 hover:shadow-md transition-all h-full'>
                  <CardContent className='p-5 space-y-4'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-stone-900 group-hover:text-emerald-700 transition-colors truncate'>
                          {r.title}
                        </h3>
                        <p className='text-sm text-stone-500 mt-1'>
                          {r.make} {r.model}
                          {r.yearFrom && <> · {r.yearFrom}+</>}
                        </p>
                      </div>
                      <Badge
                        variant='outline'
                        className={
                          r.status === 'open'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }
                      >
                        {r.status}
                      </Badge>
                    </div>

                    <Separator className='bg-stone-100' />

                    <div className='space-y-2 text-sm'>
                      {r.locationCity && (
                        <div className='flex items-center gap-2 text-stone-600'>
                          <MapPin className='w-4 h-4 text-stone-400' />
                          {r.locationCity}
                        </div>
                      )}
                      {r.budgetMax && (
                        <div className='flex items-center gap-2'>
                          <TrendingUp className='w-4 h-4 text-stone-400' />
                          <span className='text-stone-600'>Maks</span>
                          <span className='font-semibold text-stone-900'>
                            {r.budgetMax.toLocaleString('nb-NO', {
                              style: 'currency',
                              currency: 'NOK',
                              maximumFractionDigits: 0,
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className='flex items-center justify-between pt-2 border-t border-stone-50'>
                      <span className='text-xs text-stone-400'>
                        {totalOffers || 0} tilbud
                      </span>
                      <span className='text-xs text-emerald-600 group-hover:text-emerald-700 font-medium flex items-center gap-1'>
                        Se detaljer
                        <ArrowRight className='w-3 h-3' />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
