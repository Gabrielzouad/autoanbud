import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, desc, eq } from 'drizzle-orm';

import {
  ArrowLeft,
  MapPin,
  Calendar,
  Car,
  Clock,
  ShieldCheck,
  MessageSquare,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
        (p): p is string => typeof p === 'string'
      )
    );
  }
  return prefs.slice(0, 10);
}

function formatStatus(status?: string | null) {
  if (!status) return 'Open';
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function BuyerRequestDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Auth
  const user = await stackServerApp.getUser();
  if (!user) notFound();

  const profile = await ensureUserProfile({ id: user.id });

  // Load request for this buyer
  const [requestRow] = await db
    .select()
    .from(buyerRequests)
    .where(
      and(eq(buyerRequests.id, id), eq(buyerRequests.buyerId, profile.userId))
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
      dealershipName: dealerships.name,
      dealershipCity: dealerships.city,
      requestMeta: buyerRequests.meta,
    })
    .from(offers)
    .innerJoin(buyerRequests, eq(offers.requestId, buyerRequests.id))
    .leftJoin(dealerships, eq(offers.dealershipId, dealerships.id))
    .where(eq(offers.requestId, id))
    .orderBy(desc(offers.createdAt));

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
            (u) => typeof u === 'string'
          )
        : undefined;

    const imageUrl =
      (Array.isArray(offer.imageUrls) &&
        offer.imageUrls.find((u) => typeof u === 'string')) ||
      requestMetaImage ||
      '/images/car-placeholder.avif';

    return {
      id: offer.id,
      car: {
        make: offer.carMake ?? '',
        model: offer.carModel ?? '',
        variant: offer.carVariant ?? '',
        year: offer.carYear ?? undefined,
        km: offer.carKm ?? undefined,
        price: offer.priceTotal ?? 0,
        regNr: offer.carRegNr ?? '',
        image: imageUrl,
      },
      dealership: {
        name: offer.dealershipName ?? 'Ukjent forhandler',
        location: offer.dealershipCity ?? 'Uspesifisert',
      },
      message:
        offer.shortMessageToBuyer ||
        'Forhandleren har ikke lagt igjen en melding.',
      receivedAt: offerCreatedAt.toLocaleDateString('nb-NO'),
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
                {requestRow.locationCity && (
                  <span className='flex items-center'>
                    <MapPin className='mr-1.5 h-4 w-4 text-stone-400' />
                    {requestRow.locationCity}
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
                <span className='text-sm text-stone-500'>Sort by:</span>
                <select className='text-sm border-none bg-transparent font-medium text-stone-900 focus:ring-0 cursor-pointer'>
                  <option>Newest first</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                </select>
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
                    className='overflow-hidden border-stone-200 shadow-sm hover:shadow-md transition-all duration-200'
                  >
                    <div className='flex flex-col md:flex-row h-full items-stretch'>
                      {/* Car Image */}
                      <div className='w-full md:w-64 h-48 md:h-full md:self-stretch bg-stone-100 relative shrink-0'>
                        <img
                          src={offer.car.image}
                          alt={`${offer.car.make} ${offer.car.model}`}
                          className='w-full h-full object-cover'
                        />
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
                            <div>
                              <div className='flex items-center gap-2 mb-1'>
                                <h3 className='font-semibold text-lg text-stone-900'>
                                  {offer.car.make} {offer.car.model}
                                </h3>
                                {offer.car.variant && (
                                  <Badge
                                    variant='outline'
                                    className='text-xs font-normal text-stone-500 border-stone-200'
                                  >
                                    {offer.car.variant}
                                  </Badge>
                                )}
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
                            <div className='text-right'>
                              <div className='text-xl font-bold text-emerald-900'>
                                {formatCurrencyNok(offer.car.price)}
                              </div>
                              <div className='text-xs text-stone-500 mt-1'>
                                {offer.receivedAt}
                              </div>
                            </div>
                          </div>

                          {offer.message && (
                            <div className='bg-stone-50 rounded-lg p-3 text-sm text-stone-600 mb-4'>
                              <p className='line-clamp-2'>
                                &quot;{offer.message}&quot;
                              </p>
                            </div>
                          )}

                          <div className='flex items-center gap-2 text-sm text-stone-500'>
                            <ShieldCheck className='h-4 w-4 text-emerald-600' />
                            <span className='font-medium text-stone-900'>
                              {offer.dealership.name}
                            </span>
                            <span>•</span>
                            <span>{offer.dealership.location}</span>
                          </div>
                        </div>

                        <div className='flex items-center gap-3 pt-4 border-t border-stone-100'>
                          <Button className='flex-1 bg-emerald-900 hover:bg-emerald-800 text-white'>
                            View Details & Contact
                          </Button>
                          <Button
                            variant='outline'
                            size='icon'
                            title='Message Dealer'
                          >
                            <MessageSquare className='h-4 w-4' />
                          </Button>
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
