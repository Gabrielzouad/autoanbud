import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';
import { ArrowLeft, Building2, Car, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { listOfferMessagesForUser } from '@/lib/services/offerMessages';
import { db, buyerRequests, offers, dealerships } from '@/db';
import { OfferChatPanel } from '@/app/(app)/dealer/(dashboard)/offers/OfferChatPanel';

interface PageProps {
  params: Promise<{ id: string; offerId: string }>;
}

function formatCurrencyNok(value?: number | null) {
  if (!value) return 'Ikke oppgitt';
  return value.toLocaleString('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  });
}

export default async function BuyerOfferDetailPage({ params }: PageProps) {
  const { id, offerId } = await params;

  const user = await stackServerApp.getUser();
  if (!user) notFound();

  const profile = await ensureUserProfile({ id: user.id });

  const [requestRow] = await db
    .select()
    .from(buyerRequests)
    .where(eq(buyerRequests.id, id));

  if (!requestRow || requestRow.buyerId !== profile.userId) {
    notFound();
  }

  const [offerRow] = await db
    .select({
      id: offers.id,
      status: offers.status,
      priceTotal: offers.priceTotal,
      createdAt: offers.createdAt,
      carMake: offers.carMake,
      carModel: offers.carModel,
      carVariant: offers.carVariant,
      carYear: offers.carYear,
      carKm: offers.carKm,
      carRegNr: offers.carRegNr,
      shortMessageToBuyer: offers.shortMessageToBuyer,
      imageUrls: offers.imageUrls,
      dealershipId: offers.dealershipId,
      dealershipName: dealerships.name,
      dealershipCity: dealerships.city,
    })
    .from(offers)
    .leftJoin(dealerships, eq(offers.dealershipId, dealerships.id))
    .where(and(eq(offers.id, offerId), eq(offers.requestId, id)));

  if (
    !offerRow ||
    offerRow.id !== offerId ||
    offerRow.dealershipId === null ||
    offerRow.dealershipName === null
  ) {
    notFound();
  }

  const { messages, context } = await listOfferMessagesForUser(offerId, profile.userId);

  const imageUrl =
    (Array.isArray(offerRow.imageUrls) && offerRow.imageUrls.find((u) => typeof u === 'string')) ||
    '/images/car-placeholder.avif';

  return (
    <div className='min-h-screen bg-stone-50 py-10 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-5xl mx-auto space-y-8'>
        <div className='flex items-center gap-3 text-sm text-stone-500'>
          <Link
            href={`/buyer/requests/${id}`}
            className='inline-flex items-center gap-2 hover:text-stone-900 transition-colors'
          >
            <ArrowLeft className='h-4 w-4' />
            Tilbake til forespørsel
          </Link>
          <span className='h-1 w-1 rounded-full bg-stone-300' />
          <span>Tilbud</span>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
          <div className='lg:col-span-2 space-y-6'>
            <Card className='overflow-hidden border-stone-200 shadow-sm'>
              <div className='aspect-[16/9] bg-stone-100 relative'>
                <img
                  src={imageUrl}
                  alt={`${offerRow.carMake} ${offerRow.carModel}`}
                  className='w-full h-full object-cover'
                />
                {offerRow.carYear && (
                  <div className='absolute top-3 left-3'>
                    <Badge className='bg-white/90 text-stone-900 hover:bg-white/90 backdrop-blur-sm shadow-sm'>
                      {offerRow.carYear}
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className='p-6 space-y-6'>
                <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4'>
                  <div>
                    <h1 className='text-2xl font-semibold text-stone-900'>
                      {offerRow.carMake} {offerRow.carModel}
                    </h1>
                    <div className='flex flex-wrap items-center gap-2 mt-2 text-sm text-stone-600'>
                      {offerRow.carVariant && <Badge variant='outline'>{offerRow.carVariant}</Badge>}
                      {offerRow.carKm !== null && (
                        <Badge
                          variant='secondary'
                          className='bg-stone-100 text-stone-700 hover:bg-stone-200'
                        >
                          {offerRow.carKm.toLocaleString('nb-NO')} km
                        </Badge>
                      )}
                      {offerRow.carRegNr && (
                        <Badge
                          variant='secondary'
                          className='bg-stone-100 text-stone-700 hover:bg-stone-200'
                        >
                          Reg.nr: {offerRow.carRegNr}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm text-stone-500'>Totalpris</p>
                    <p className='text-2xl font-bold text-emerald-900'>{formatCurrencyNok(offerRow.priceTotal)}</p>
                  </div>
                </div>

                <Separator className='bg-stone-100' />

                <div className='space-y-3'>
                  <div className='flex items-center gap-2 text-sm text-stone-600'>
                    <Building2 className='h-4 w-4 text-emerald-700' />
                    <span className='font-medium text-stone-900'>{offerRow.dealershipName}</span>
                    {offerRow.dealershipCity && <span>· {offerRow.dealershipCity}</span>}
                  </div>
                  <div className='bg-stone-50 p-4 rounded-lg border border-stone-100 text-stone-700'>
                    <p className='text-sm font-semibold text-stone-900 mb-1'>Melding fra forhandler</p>
                    <p className='text-sm leading-relaxed'>
                      {offerRow.shortMessageToBuyer || 'Forhandleren har ikke lagt igjen en melding.'}
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-stone-600'>
                  <div className='flex items-center gap-2'>
                    <Car className='h-4 w-4 text-emerald-700' />
                    <span>Status: </span>
                    <span className='font-medium capitalize text-stone-900'>{offerRow.status ?? 'ukjent'}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <ShieldCheck className='h-4 w-4 text-emerald-700' />
                    <span>Dette tilbudet er koblet til din forespørsel.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <OfferChatPanel
              offerId={offerId}
              viewerRole={context.viewerRole}
              initialMessages={messages}
            />
          </div>

          <div className='space-y-4'>
            <Card className='border-stone-200'>
              <CardHeader>
                <CardTitle className='text-lg font-serif text-emerald-950'>Forespørsel</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='text-sm text-stone-600'>
                  <p className='font-medium text-stone-900'>{requestRow.title}</p>
                  <p className='mt-1 leading-relaxed'>
                    {requestRow.description || 'Ingen nærmere beskrivelse angitt.'}
                  </p>
                </div>
                <div className='bg-stone-50 border border-stone-100 rounded-lg p-3 text-sm text-stone-600'>
                  <p className='font-semibold text-stone-900 mb-1'>Budjsett</p>
                  <p>{formatCurrencyNok(requestRow.budgetMax)}</p>
                </div>
                <Button asChild className='w-full bg-emerald-900 hover:bg-emerald-800 text-white'>
                  <Link href={`/buyer/requests/${id}`}>Se alle tilbud</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
