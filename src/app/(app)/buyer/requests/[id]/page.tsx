import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';

import {
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  ShieldCheck,
  MessageSquare,
  Star,
  Truck,
  CreditCard,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NoImageAvailable } from '@/components/NoImageAvailable';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { db, buyerRequests, offers, dealerships } from '@/db';
import { isValidUUID } from '@/lib/errors';
import { getAvgResponseTimeForDealership } from '@/lib/services/offerMessages';
import { MarketplaceEvents, trackBuyerEvent } from '@/lib/analytics';

interface PageProps {
  params: Promise<{ id: string }>;
}

function formatCurrencyNok(value?: number | null) {
  if (!value) return '–';
  return value.toLocaleString('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  });
}

function buildPreferences(request: {
  fuelType?: string | null;
  gearbox?: string | null;
  bodyType?: string | null;
  wantsTradeIn?: boolean | null;
  financingNeeded?: boolean | null;
  meta?: unknown;
}) {
  const prefs: string[] = [];
  if (request.fuelType) prefs.push(request.fuelType);
  if (request.gearbox) prefs.push(request.gearbox);
  if (request.bodyType) prefs.push(request.bodyType);
  if (request.wantsTradeIn) prefs.push('Has trade-in');
  if (request.financingNeeded) prefs.push('Needs financing');
  if (
    request.meta &&
    typeof request.meta === 'object' &&
    Array.isArray((request.meta as { preferences?: unknown[] }).preferences)
  ) {
    prefs.push(
      ...(request.meta as { preferences: unknown[] }).preferences.filter(
        (p): p is string => typeof p === 'string',
      ),
    );
  }
  return prefs.slice(0, 10);
}

function formatStatus(status?: string | null) {
  if (!status) return 'Open';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getOfferStatusLabel(status?: string | null) {
  switch (status) {
    case 'accepted':
      return 'Akseptert';
    case 'rejected':
      return 'Avslått';
    case 'withdrawn':
      return 'Trukket tilbake';
    case 'expired':
      return 'Utløpt';
    default:
      return null;
  }
}

function isInactiveOffer(status?: string | null) {
  return status === 'rejected' || status === 'withdrawn' || status === 'expired';
}

export default async function BuyerRequestDetailPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidUUID(id)) notFound();

  // Auth
  const user = await stackServerApp.getUser();
  if (!user) notFound();

  const profile = await ensureUserProfile({ id: user.id });

  // Load request for this buyer
  const [requestRow] = await db
    .select()
    .from(buyerRequests)
    .where(
      and(eq(buyerRequests.id, id), eq(buyerRequests.buyerId, profile.userId)),
    );

  if (!requestRow) notFound();

  const createdAt =
    requestRow.createdAt instanceof Date
      ? requestRow.createdAt
      : new Date(requestRow.createdAt);

  const preferences = buildPreferences(requestRow);

  // Load offers for this request (with dealership info)
  const offerRows = await db
    .select({
      id: offers.id,
      status: offers.status,
      dealershipId: offers.dealershipId,
      createdAt: offers.createdAt,
      carMake: offers.carMake,
      carModel: offers.carModel,
      carVariant: offers.carVariant,
      carYear: offers.carYear,
      carKm: offers.carKm,
      carRegNr: offers.carRegNr,
      shortMessageToBuyer: offers.shortMessageToBuyer,
      imageUrls: offers.imageUrls,
      qualityScore: offers.qualityScore,
      deliveryTimeEstimate: offers.deliveryTimeEstimate,
      warrantySummary: offers.warrantySummary,
      financingPossible: offers.financingPossible,
      dealershipName: dealerships.name,
      dealershipCity: dealerships.city,
      dealershipVerified: dealerships.verified,
      dealershipVerificationState: dealerships.verificationState,
      requestMeta: buyerRequests.meta,
    })
    .from(offers)
    .innerJoin(buyerRequests, eq(offers.requestId, buyerRequests.id))
    .leftJoin(dealerships, eq(offers.dealershipId, dealerships.id))
    .where(eq(offers.requestId, id))
    .orderBy(desc(offers.qualityScore), desc(offers.createdAt));

  const responseTimes = new Map(
    await Promise.all(
      Array.from(new Set(offerRows.map((offer) => offer.dealershipId))).map(
        async (dealershipId) =>
          [dealershipId, await getAvgResponseTimeForDealership(dealershipId)] as const,
      ),
    ),
  );

  if (offerRows.length > 0) {
    trackBuyerEvent(profile.userId, MarketplaceEvents.BUYER_OFFER_COMPARISON_VIEWED, {
      requestId: id,
      offerCount: offerRows.length,
      sort: 'offer_quality_score',
    });
  }

  const offersView = offerRows.map((offer) => {
    const offerCreatedAt =
      offer.createdAt instanceof Date
        ? offer.createdAt
        : new Date(offer.createdAt);

    const requestMetaImage =
      offer.requestMeta &&
      typeof offer.requestMeta === 'object' &&
      Array.isArray((offer.requestMeta as { imageUrls?: unknown[] }).imageUrls)
        ? (offer.requestMeta as { imageUrls: unknown[] }).imageUrls.find(
            (u) => typeof u === 'string',
          )
        : undefined;

    const imageUrl =
      (Array.isArray(offer.imageUrls) &&
        offer.imageUrls.find((u) => typeof u === 'string')) ||
      requestMetaImage ||
      undefined;

    return {
      id: offer.id,
      status: offer.status,
      car: {
        make: offer.carMake ?? '',
        model: offer.carModel ?? '',
        variant: offer.carVariant ?? '',
        year: offer.carYear ?? undefined,
        km: offer.carKm ?? undefined,
        regNr: offer.carRegNr ?? '',
        image: imageUrl,
      },
      dealership: {
        id: offer.dealershipId,
        name: offer.dealershipName ?? 'Ukjent forhandler',
        location: offer.dealershipCity ?? 'Uspesifisert',
        verified:
          offer.dealershipVerified === true ||
          offer.dealershipVerificationState === 'verified',
        responseTime: responseTimes.get(offer.dealershipId) ?? 'Ikke nok data',
      },
      value: {
        warranty: offer.warrantySummary || 'Garanti avklares med forhandler',
        delivery: offer.deliveryTimeEstimate || 'Levering avklares med forhandler',
        financing: offer.financingPossible
          ? 'Finansiering mulig'
          : 'Finansiering ikke markert',
      },
      qualityScore:
        typeof offer.qualityScore === 'number' && offer.qualityScore > 0
          ? offer.qualityScore
          : undefined,
      message:
        offer.shortMessageToBuyer ||
        'Forhandleren har ikke lagt igjen en melding.',
      receivedAt: offerCreatedAt.toLocaleDateString('nb-NO'),
      statusLabel: getOfferStatusLabel(offer.status),
      isInactive: isInactiveOffer(offer.status),
    };
  });

  return (
    <div className='min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-6xl mx-auto space-y-8'>
        {/* Header */}
        <div className='space-y-4'>
          <Link
            href='/buyer/requests'
            className='inline-flex items-center text-sm text-stone-500 hover:text-stone-900 transition-colors'
          >
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to requests
          </Link>

          <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>
            <div className='space-y-1'>
              <div className='flex items-center gap-3'>
                <h1 className='text-3xl font-bold font-serif text-stone-900'>
                  {requestRow.title}
                </h1>
                <Badge className='bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200'>
                  {formatStatus(requestRow.status)}
                </Badge>
              </div>
              <div className='flex flex-wrap items-center gap-4 text-sm text-stone-600'>
                <span className='flex items-center'>
                  <Car className='mr-1.5 h-4 w-4 text-stone-400' />
                  {(requestRow.make ?? 'Uspesifisert') +
                    ' ' +
                    (requestRow.model ?? '')}
                </span>
                {requestRow.yearFrom && (
                  <span className='flex items-center'>
                    <Calendar className='mr-1.5 h-4 w-4 text-stone-400' />
                    {requestRow.yearFrom}+
                  </span>
                )}
                {typeof requestRow.qualityScore === 'number' &&
                  requestRow.qualityScore > 0 && (
                    <span className='inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-800'>
                      Kvalitet {requestRow.qualityScore}%
                    </span>
                  )}
                {requestRow.budgetMax && (
                  <span className='font-medium text-stone-900'>
                    Max: {formatCurrencyNok(requestRow.budgetMax)}
                  </span>
                )}
              </div>
            </div>
            <Button variant='outline' size='sm'>
              Edit Request
            </Button>
          </div>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Main Content - Offers */}
          <div className='lg:col-span-2 space-y-6'>
            <div className='flex items-center justify-between'>
              <h2 className='text-xl font-semibold font-serif text-stone-900'>
                Offers Received{' '}
                <span className='text-stone-400 font-sans text-base ml-1'>
                  ({offersView.length})
                </span>
              </h2>
              <div className='flex items-center gap-2'>
                <ShieldCheck className='h-4 w-4 text-emerald-700' />
                <span className='text-sm font-medium text-stone-700'>
                  Sortert etter best fit
                </span>
              </div>
            </div>

            {offersView.length === 0 ? (
              <Card className='border-dashed border-2 border-stone-200 bg-stone-50/50'>
                <CardContent className='flex flex-col items-center justify-center py-12 text-center space-y-4'>
                  <div className='p-3 bg-white rounded-full shadow-sm'>
                    <Clock className='h-6 w-6 text-stone-400' />
                  </div>
                  <div className='space-y-1'>
                    <h3 className='text-lg font-medium text-stone-900'>
                      Waiting for offers
                    </h3>
                    <p className='text-stone-500 max-w-sm mx-auto'>
                      We&apos;ve sent your request to relevant dealers.
                      You&apos;ll be notified when they respond.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className='space-y-4'>
                {offersView.map((offer) => (
                  <Card
                    key={offer.id}
                    className={
                      'overflow-hidden border-stone-200 shadow-sm transition-all duration-200 ' +
                      (offer.status === 'accepted'
                        ? 'border-emerald-300 ring-1 ring-emerald-200'
                        : offer.isInactive
                          ? 'bg-stone-50/70'
                          : 'hover:shadow-md')
                    }
                  >
                    <div className='grid grid-cols-1 md:grid-cols-[minmax(220px,260px)_1fr] h-full items-stretch'>
                      {/* Car Image */}
                      <div className='relative min-h-56 aspect-[16/10] md:aspect-auto md:min-h-[320px] md:h-full bg-stone-100 overflow-hidden'>
                        {offer.car.image ? (
                          <img
                            src={offer.car.image}
                            alt={`${offer.car.make} ${offer.car.model}`}
                            className={
                              'w-full h-full object-cover object-center ' +
                              (offer.isInactive ? 'grayscale opacity-75' : '')
                            }
                          />
                        ) : (
                          <NoImageAvailable
                            className={offer.isInactive ? 'opacity-75' : ''}
                          />
                        )}
                        {offer.isInactive && offer.statusLabel && (
                          <div className='absolute inset-x-0 bottom-0 bg-stone-950/70 px-3 py-2 text-sm font-medium text-white backdrop-blur-sm'>
                            {offer.statusLabel}
                          </div>
                        )}
                        {offer.car.year && (
                          <div className='absolute top-2 left-2'>
                            <Badge className='bg-white/90 text-stone-900 hover:bg-white/90 backdrop-blur-sm shadow-sm'>
                              {offer.car.year}
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Offer Details */}
                      <div className='flex-1 p-5 flex flex-col justify-between gap-4'>
                        <div>
                          <div className='flex items-start justify-between gap-4'>
                            <div className='space-y-3'>
                              <div className='flex flex-wrap items-center gap-2'>
                                {offer.dealership.verified && (
                                  <Badge className='bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-50'>
                                    <ShieldCheck className='mr-1 h-3.5 w-3.5' />
                                    Verifisert forhandler
                                  </Badge>
                                )}
                                <Badge
                                  variant='outline'
                                  className='border-stone-200 bg-white text-stone-700'
                                >
                                  <Clock className='mr-1 h-3.5 w-3.5 text-emerald-700' />
                                  Svar {offer.dealership.responseTime}
                                </Badge>
                                <Badge
                                  variant='outline'
                                  className='border-stone-200 bg-white text-stone-700'
                                >
                                  <Star className='mr-1 h-3.5 w-3.5 text-amber-500' />
                                  Vurdering kommer
                                </Badge>
                              </div>

                              <div>
                                <div className='flex flex-wrap items-center gap-2 mb-1'>
                                  <span className='font-medium text-stone-900'>
                                    {offer.dealership.name}
                                  </span>
                                  <span className='text-stone-300'>•</span>
                                  <span className='text-sm text-stone-500'>
                                    {offer.dealership.location}
                                  </span>
                                </div>
                                <h3 className='font-semibold text-lg text-stone-900'>
                                  {offer.car.make} {offer.car.model}
                                </h3>
                                <div className='mt-2 flex flex-wrap items-center gap-2'>
                                  {offer.car.variant && (
                                    <Badge
                                      variant='outline'
                                      className='text-xs font-normal text-stone-500 border-stone-200'
                                    >
                                      {offer.car.variant}
                                    </Badge>
                                  )}
                                  {offer.status === 'accepted' && (
                                    <Badge className='bg-emerald-100 text-emerald-800 hover:bg-emerald-100'>
                                      Akseptert
                                    </Badge>
                                  )}
                                  {offer.statusLabel && offer.status !== 'accepted' && (
                                    <Badge
                                      variant='outline'
                                      className='text-stone-500 border-stone-200 bg-white'
                                    >
                                      {offer.statusLabel}
                                    </Badge>
                                  )}
                                  {typeof offer.qualityScore === 'number' &&
                                    offer.qualityScore > 0 && (
                                      <Badge className='bg-blue-50 text-blue-700 border-blue-200'>
                                        Match {offer.qualityScore}%
                                      </Badge>
                                    )}
                                </div>
                              </div>
                              <div className='flex items-center gap-3 text-sm text-stone-500 mb-3'>
                                {offer.car.km !== undefined && (
                                  <>
                                    <span>
                                      {offer.car.km.toLocaleString('nb-NO')} km
                                    </span>
                                    <span className='w-1 h-1 rounded-full bg-stone-300' />
                                  </>
                                )}
                                {offer.car.regNr && (
                                  <span>{offer.car.regNr}</span>
                                )}
                              </div>
                            </div>
                            <div className='text-right shrink-0'>
                              <div className='rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600'>
                                Pris i detalj
                              </div>
                              <div className='text-xs text-stone-500 mt-1'>
                                {offer.receivedAt}
                              </div>
                            </div>
                          </div>

                          <div className='grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4'>
                            <div className='rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-700'>
                              <ShieldCheck className='mb-1 h-4 w-4 text-emerald-700' />
                              <p className='text-xs font-medium uppercase text-stone-500'>
                                Garanti
                              </p>
                              <p className='mt-1 line-clamp-2'>
                                {offer.value.warranty}
                              </p>
                            </div>
                            <div className='rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-700'>
                              <Truck className='mb-1 h-4 w-4 text-emerald-700' />
                              <p className='text-xs font-medium uppercase text-stone-500'>
                                Levering
                              </p>
                              <p className='mt-1 line-clamp-2'>
                                {offer.value.delivery}
                              </p>
                            </div>
                            <div className='rounded-lg border border-stone-100 bg-stone-50 px-3 py-2 text-sm text-stone-700'>
                              <CreditCard className='mb-1 h-4 w-4 text-emerald-700' />
                              <p className='text-xs font-medium uppercase text-stone-500'>
                                Finansiering
                              </p>
                              <p className='mt-1 line-clamp-2'>
                                {offer.value.financing}
                              </p>
                            </div>
                          </div>

                          {offer.message && (
                            <div className='bg-stone-50 rounded-lg p-3 text-sm text-stone-600 mb-4'>
                              <p className='line-clamp-2'>
                                &quot;{offer.message}&quot;
                              </p>
                            </div>
                          )}
                        </div>

                        <div className='flex items-center gap-3 pt-4 border-t border-stone-100'>
                          <Button
                            asChild
                            variant={offer.isInactive ? 'outline' : 'default'}
                            className={
                              'flex-1 ' +
                              (offer.isInactive
                                ? 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                                : 'bg-emerald-900 hover:bg-emerald-800 text-white')
                            }
                          >
                            <Link
                              href={`/buyer/requests/${id}/offers/${offer.id}`}
                            >
                              {offer.isInactive
                                ? 'Se tilbudshistorikk'
                                : 'Se detaljer og pris'}
                            </Link>
                          </Button>
                          {!offer.isInactive && (
                            <Button
                              asChild
                              variant='outline'
                              size='icon'
                              title='Message Dealer'
                            >
                              <Link
                                href={`/buyer/requests/${id}/offers/${offer.id}`}
                              >
                                <MessageSquare className='h-4 w-4' />
                              </Link>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar - Request Summary */}
          <div className='space-y-6'>
            <Card className='border-stone-200 shadow-sm h-fit sticky top-6'>
              <CardHeader className='pb-3 border-b border-stone-100'>
                <CardTitle className='text-lg font-serif'>
                  Request Summary
                </CardTitle>
              </CardHeader>
              <CardContent className='pt-4 space-y-4'>
                <div className='space-y-3'>
                  <div>
                    <span className='text-xs font-medium text-stone-500 uppercase tracking-wider'>
                      Description
                    </span>
                    <p className='text-sm text-stone-700 mt-1 leading-relaxed'>
                      {requestRow.description || 'No description provided.'}
                    </p>
                  </div>

                  <Separator className='bg-stone-100' />

                  <div>
                    <span className='text-xs font-medium text-stone-500 uppercase tracking-wider'>
                      Preferences
                    </span>
                    {preferences.length > 0 ? (
                      <div className='flex flex-wrap gap-2 mt-2'>
                        {preferences.map((pref) => (
                          <Badge
                            key={pref}
                            variant='secondary'
                            className='bg-stone-100 text-stone-700 hover:bg-stone-200'
                          >
                            {pref}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className='text-sm text-stone-500 mt-2'>
                        No specific preferences registered.
                      </p>
                    )}
                  </div>

                  <Separator className='bg-stone-100' />

                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <span className='text-xs font-medium text-stone-500 uppercase tracking-wider'>
                        Created
                      </span>
                      <p className='text-sm text-stone-900 mt-1'>
                        {createdAt.toLocaleDateString('nb-NO')}
                      </p>
                    </div>
                    <div>
                      <span className='text-xs font-medium text-stone-500 uppercase tracking-wider'>
                        Expires
                      </span>
                      <p className='text-sm text-stone-900 mt-1'>In 28 days</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className='bg-stone-50/50 border-t border-stone-100 p-4'>
                <Button
                  variant='ghost'
                  className='w-full text-red-600 hover:text-red-700 hover:bg-red-50'
                >
                  Close Request
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
