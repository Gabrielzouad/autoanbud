import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, eq } from 'drizzle-orm';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  User,
  Gauge,
  Fuel,
  Settings,
} from 'lucide-react';

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { db, offers, buyerRequests } from '@/db';
import { listOfferMessagesForUser } from '@/lib/services/offerMessages';
import { OfferChatPanel } from '../OfferChatPanel';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DealerOfferDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Auth + dealer guard
  const user = await stackServerApp.getUser();
  if (!user) notFound();

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);
  if (dealerships.length === 0) notFound();

  const dealership = dealerships[0];

  // Load this offer and its linked buyer request, scoped to this dealership
  const rows = await db
    .select({
      offer: offers,
      request: buyerRequests,
    })
    .from(offers)
    .innerJoin(buyerRequests, eq(offers.requestId, buyerRequests.id))
    .where(and(eq(offers.id, id), eq(offers.dealershipId, dealership.id)));

  if (rows.length === 0) {
    notFound();
  }

  const { offer, request } = rows[0];

  let initialMessagesData;
  try {
    initialMessagesData = await listOfferMessagesForUser(offer.id, profile.userId);
  } catch (error) {
    console.error('Failed to load offer chat', error);
    notFound();
  }

  const { messages: initialMessages, context: conversation } = initialMessagesData!;

  const createdAt =
    offer.createdAt instanceof Date
      ? offer.createdAt
      : new Date(offer.createdAt);
  const expiresAt = new Date(
    createdAt.getTime() + 7 * 24 * 60 * 60 * 1000 // simple 7-day validity
  );

  const statusForBadge =
    offer.status === 'submitted' ? 'pending' : offer.status;

  const statusBadgeClass =
    statusForBadge === 'accepted'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : statusForBadge === 'pending'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : statusForBadge === 'rejected'
      ? 'bg-red-50 text-red-700 border-red-200'
      : 'bg-stone-50 text-stone-700 border-stone-200';

  const formattedBudget = request.budgetMax
    ? `Inntil ${request.budgetMax.toLocaleString('nb-NO')} kr`
    : 'Ikke oppgitt';

  // Very simple timeline for now
  const timeline = [
    {
      date: createdAt,
      event: 'Tilbud sendt',
      description: `Du sendte et tilbud på ${offer.priceTotal?.toLocaleString(
        'nb-NO'
      )} kr`,
    },
  ];

  return (
    <div className='space-y-6 max-w-5xl mx-auto'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div className='flex items-center gap-4'>
          <Button variant='ghost' size='icon' asChild className='h-8 w-8 -ml-2'>
            <Link href='/dealer/offers'>
              <ArrowLeft className='h-4 w-4' />
            </Link>
          </Button>
          <div>
            <div className='flex items-center gap-3'>
              <h1 className='text-2xl font-serif font-medium text-emerald-950'>
                Tilbud #{offer.id.slice(0, 6)}
              </h1>
              <Badge
                variant='outline'
                className={`${statusBadgeClass} capitalize`}
              >
                {statusForBadge}
              </Badge>
            </div>
            <p className='text-sm text-stone-500'>
              Sendt{' '}
              {createdAt.toLocaleDateString('nb-NO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className='flex gap-3'>
          <Button
            variant='outline'
            className='border-stone-200 text-stone-600 bg-transparent'
            disabled
          >
            Trekk tilbake (kommer)
          </Button>
          <Button
            className='bg-emerald-900 hover:bg-emerald-800 text-white'
            disabled
          >
            Rediger tilbud (kommer)
          </Button>
        </div>
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Main Content - Left Column */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Car Details Card */}
          <Card className='border-stone-200 overflow-hidden'>
            <div className='aspect-video w-full bg-stone-100 relative'>
              <img
                src='/images/car-placeholder.avif'
                alt={offer.carModel ?? 'Bil'}
                className='w-full h-full object-cover'
              />
              <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6'>
                <h2 className='text-2xl font-serif text-white'>
                  {offer.carMake ?? request.make}{' '}
                  {offer.carModel ?? request.model}
                </h2>
                {offer.carVariant && (
                  <p className='text-stone-200'>{offer.carVariant}</p>
                )}
              </div>
            </div>
            <CardContent className='p-6'>
              <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6'>
                <div className='space-y-1'>
                  <span className='text-xs text-stone-500 flex items-center gap-1'>
                    <Calendar className='h-3 w-3' /> Årsmodell
                  </span>
                  <p className='font-medium text-stone-900'>
                    {offer.carYear ?? 'Ikke oppgitt'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs text-stone-500 flex items-center gap-1'>
                    <Gauge className='h-3 w-3' /> Kilometer
                  </span>
                  <p className='font-medium text-stone-900'>
                    {offer.carKm
                      ? `${offer.carKm.toLocaleString('nb-NO')} km`
                      : 'Ikke oppgitt'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs text-stone-500 flex items-center gap-1'>
                    <Fuel className='h-3 w-3' /> Drivlinje
                  </span>
                  <p className='font-medium text-stone-900'>
                    {offer.fuelType ?? 'Ikke oppgitt'}
                  </p>
                </div>
                <div className='space-y-1'>
                  <span className='text-xs text-stone-500 flex items-center gap-1'>
                    <Settings className='h-3 w-3' /> Girtype
                  </span>
                  <p className='font-medium text-stone-900'>
                    {offer.gearbox ?? 'Ikke oppgitt'}
                  </p>
                </div>
              </div>

              <Separator className='my-6' />

              <h3 className='font-medium text-emerald-950 mb-3'>
                Nøkkeldetaljer
              </h3>
              <div className='flex flex-wrap gap-2'>
                {offer.carVariant && (
                  <Badge
                    variant='secondary'
                    className='bg-stone-100 text-stone-700 hover:bg-stone-200'
                  >
                    {offer.carVariant}
                  </Badge>
                )}
                {offer.colorExterior && (
                  <Badge
                    variant='secondary'
                    className='bg-stone-100 text-stone-700 hover:bg-stone-200'
                  >
                    Eksteriør: {offer.colorExterior}
                  </Badge>
                )}
                {offer.colorInterior && (
                  <Badge
                    variant='secondary'
                    className='bg-stone-100 text-stone-700 hover:bg-stone-200'
                  >
                    Interiør: {offer.colorInterior}
                  </Badge>
                )}
                {offer.carRegNr && (
                  <Badge
                    variant='secondary'
                    className='bg-stone-100 text-stone-700 hover:bg-stone-200'
                  >
                    Reg.nr: {offer.carRegNr}
                  </Badge>
                )}
                {!offer.carVariant &&
                  !offer.colorExterior &&
                  !offer.colorInterior &&
                  !offer.carRegNr && (
                    <p className='text-sm text-stone-500'>
                      Ingen ekstra detaljer registrert.
                    </p>
                  )}
              </div>
            </CardContent>
          </Card>

          {/* Message Card */}
          <Card className='border-stone-200'>
            <CardHeader>
              <CardTitle className='text-lg font-serif text-emerald-950 flex items-center gap-2'>
                <MessageSquare className='h-5 w-5 text-emerald-600' />
                Din melding til kjøper
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='bg-stone-50 p-4 rounded-lg border border-stone-100 text-stone-700 italic'>
                &quot;
                {offer.shortMessageToBuyer ||
                  'Du har ikke lagt inn en melding til kjøper på dette tilbudet.'}
                &quot;
              </div>
            </CardContent>
          </Card>

          <OfferChatPanel
            offerId={offer.id}
            viewerRole={conversation.viewerRole}
            initialMessages={initialMessages}
          />
        </div>

        {/* Sidebar - Right Column */}
        <div className='space-y-6'>
          {/* Offer Summary */}
          <Card className='border-stone-200 bg-emerald-50/50'>
            <CardHeader>
              <CardTitle className='text-lg font-serif text-emerald-950'>
                Sammendrag av tilbud
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex justify-between items-end'>
                <span className='text-stone-600'>Totalpris</span>
                <span className='text-2xl font-bold text-emerald-900'>
                  {offer.priceTotal
                    ? `${offer.priceTotal.toLocaleString('nb-NO')} kr`
                    : 'Ikke oppgitt'}
                </span>
              </div>
              <Separator className='bg-emerald-200/50' />
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-stone-500'>Status</span>
                  <span className='font-medium capitalize text-stone-900'>
                    {statusForBadge}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-stone-500'>Utløper</span>
                  <span className='font-medium text-stone-900'>
                    {expiresAt.toLocaleDateString('nb-NO')}
                  </span>
                </div>
                <div className='flex justify-between'>
                  <span className='text-stone-500'>Reg.nr</span>
                  <span className='font-medium text-stone-900'>
                    {offer.carRegNr || 'Ikke oppgitt'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Buyer Request Info */}
          <Card className='border-stone-200'>
            <CardHeader>
              <CardTitle className='text-lg font-serif text-emerald-950 flex items-center gap-2'>
                <User className='h-5 w-5 text-emerald-600' />
                Kjøpers forespørsel
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h4 className='font-medium text-stone-900'>{request.title}</h4>
                <p className='text-sm text-stone-500 mt-1 line-clamp-3'>
                  {request.description ||
                    'Ingen nærmere beskrivelse fra kjøper.'}
                </p>
              </div>

              <div className='space-y-3 pt-2'>
                <div className='flex items-center gap-3 text-sm'>
                  <div className='h-8 w-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-serif font-bold'>
                    {/* We don't store buyer name yet, so just use B */}B
                  </div>
                  <div>
                    <p className='font-medium text-stone-900'>
                      Kjøper via BilMarked
                    </p>
                    <p className='text-xs text-stone-500'>
                      {request.locationCity ?? 'Sted ikke oppgitt'}
                    </p>
                  </div>
                </div>

                <div className='bg-stone-50 p-3 rounded border border-stone-100 text-sm'>
                  <span className='text-stone-500 block text-xs mb-1'>
                    Budsjett
                  </span>
                  <span className='font-medium text-stone-900'>
                    {formattedBudget}
                  </span>
                </div>
              </div>

              <Button
                variant='outline'
                className='w-full text-xs h-8 bg-transparent'
                asChild
              >
                <Link href={`/dealer/requests/${request.id}`}>
                  Vis full forespørsel
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card className='border-stone-200'>
            <CardHeader>
              <CardTitle className='text-lg font-serif text-emerald-950'>
                Tidslinje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='relative pl-4 border-l border-stone-200 space-y-6'>
                {timeline.map((event, i) => (
                  <div key={i} className='relative'>
                    <div className='absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-white' />
                    <p className='text-xs text-stone-400 mb-0.5'>
                      {event.date.toLocaleString('nb-NO', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className='text-sm font-medium text-stone-900'>
                      {event.event}
                    </p>
                    <p className='text-xs text-stone-500'>
                      {event.description}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
