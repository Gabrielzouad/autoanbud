// src/app/dealer/(dashboard)/page.tsx

import {
  Store,
  CarFront,
  Inbox,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Phone,
  Mail,
  Building2,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { listOpenBuyerRequests } from '@/lib/services/dealerRequests';
import { listOffersForDealershipWithRequest } from '@/lib/services/offers';
import Link from 'next/link';

function formatCurrencyNok(value: number | null | undefined) {
  if (!value) return '–';
  return value.toLocaleString('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    maximumFractionDigits: 0,
  });
}

function formatDateShort(date: Date | string | null | undefined) {
  if (!date) return '–';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('nb-NO');
}

export default async function DealerDashboardPage() {
  const user = await stackServerApp.getUser();
  if (!user) return null; // layout will redirect

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);

  if (dealerships.length === 0) return null; // layout will redirect to onboarding

  const dealership = dealerships[0];

  // Real data: open buyer requests (global) + offers for this dealership
  const [openRequests, offerRows] = await Promise.all([
    listOpenBuyerRequests(),
    listOffersForDealershipWithRequest(dealership.id),
  ]);

  // Stats derived from real data
  const openRequestsCount = openRequests.length;
  const activeOffersCount = offerRows.filter(
    (row) => row.offer.status === 'submitted'
  ).length;
  const acceptedOffersCount = offerRows.filter(
    (row) => row.offer.status === 'accepted'
  ).length;

  // We don't track real responseRate/avgResponseTime yet → placeholder
  const stats = {
    openRequests: openRequestsCount,
    activeOffers: activeOffersCount,
    acceptedOffers: acceptedOffersCount,
    responseRate: '–',
    avgResponseTime: '–',
  };

  const latestOffers = offerRows.slice(0, 3);

  return (
    <div className='min-h-screen bg-stone-50/50 p-6 md:p-8 space-y-8'>
      {/* Header Section */}
      <div className='flex flex-col gap-6 md:flex-row md:items-start md:justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <Badge
              variant='outline'
              className='bg-white text-stone-600 border-stone-200'
            >
              <Store className='w-3 h-3 mr-1' />
              Forhandler Dashboard
            </Badge>
            {/* Treat all dealerships as "verified" for now */}
            <Badge
              variant='outline'
              className='gap-1 border-emerald-300 text-emerald-800'
            >
              <CheckCircle2 className='w-3 h-3' />
              Verifisert
            </Badge>
          </div>
          <h1 className='font-serif text-3xl md:text-4xl font-bold text-stone-900'>
            {dealership.name}
          </h1>
          <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
            <div className='flex items-center gap-1.5'>
              <MapPin className='w-4 h-4' />
              {dealership.address && <>{dealership.address}, </>}
              {dealership.postalCode} {dealership.city}
            </div>
            {dealership.orgNumber && (
              <div className='flex items-center gap-1.5'>
                <Building2 className='w-4 h-4' />
                Org.nr: {dealership.orgNumber}
              </div>
            )}
          </div>
        </div>

        <div className='flex flex-wrap gap-3'>
          <Button
            asChild
            className='bg-emerald-900 hover:bg-emerald-800 shadow-sm'
          >
            <Link href='/dealer/requests'>
              <Inbox className='w-4 h-4 mr-2' />
              Se nye forespørsler
            </Link>
          </Button>
          <Button variant='outline' className='bg-white' disabled>
            Rediger profil
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='bg-white border-stone-200 shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between space-y-0 pb-2'>
              <p className='text-sm font-medium text-muted-foreground'>
                Aktive forespørsler
              </p>
              <CarFront className='h-4 w-4 text-emerald-600' />
            </div>
            <div className='flex items-baseline gap-2'>
              <div className='text-2xl font-bold'>{stats.openRequests}</div>
              <span className='text-xs text-emerald-600 font-medium flex items-center'>
                <TrendingUp className='w-3 h-3 mr-1' />
                {/* Placeholder trend */}
                +0 i dag
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white border-stone-200 shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between space-y-0 pb-2'>
              <p className='text-sm font-medium text-muted-foreground'>
                Dine aktive tilbud
              </p>
              <Inbox className='h-4 w-4 text-blue-600' />
            </div>
            <div className='flex items-baseline gap-2'>
              <div className='text-2xl font-bold'>{stats.activeOffers}</div>
              <span className='text-xs text-muted-foreground'>
                Venter på svar
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white border-stone-200 shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between space-y-0 pb-2'>
              <p className='text-sm font-medium text-muted-foreground'>
                Aksepterte tilbud
              </p>
              <CheckCircle2 className='h-4 w-4 text-emerald-600' />
            </div>
            <div className='flex items-baseline gap-2'>
              <div className='text-2xl font-bold'>{stats.acceptedOffers}</div>
              <span className='text-xs text-muted-foreground'>
                Totalt gjennom BilMarked
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white border-stone-200 shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between space-y-0 pb-2'>
              <p className='text-sm font-medium text-muted-foreground'>
                Snitt svartid
              </p>
              <Clock className='h-4 w-4 text-amber-600' />
            </div>
            <div className='flex items-baseline gap-2'>
              <div className='text-2xl font-bold'>{stats.avgResponseTime}</div>
              <span className='text-xs text-muted-foreground'>
                (kommer senere)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-8 lg:grid-cols-3'>
        {/* Main Content Area */}
        <div className='lg:col-span-2 space-y-8'>
          {/* Action Required Section */}
          <section className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='font-serif text-xl font-semibold text-stone-900'>
                Nye forespørsler som matcher deg
              </h2>
              <Button variant='link' className='text-emerald-900' asChild>
                <Link href='/dealer/requests'>
                  Se alle ({openRequestsCount})
                </Link>
              </Button>
            </div>
            <div className='grid gap-4'>
              {openRequests.length === 0 ? (
                <Card className='bg-white border-stone-200'>
                  <CardContent className='p-5 text-sm text-muted-foreground space-y-3'>
                    <p>Det er ingen åpne forespørsler akkurat nå.</p>
                    <Button asChild size='sm'>
                      <Link href='/dealer/requests'>Gå til forespørsler</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                openRequests.slice(0, 4).map((req) => (
                  <Card
                    key={req.id}
                    className='bg-white border-stone-200 hover:border-emerald-200 transition-colors cursor-pointer group'
                  >
                    <CardContent className='p-5'>
                      <div className='flex flex-col md:flex-row gap-4 justify-between'>
                        <div className='space-y-2'>
                          <div className='flex items-center gap-2'>
                            <Badge
                              variant='secondary'
                              className='bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            >
                              Match
                            </Badge>
                            <span className='text-xs text-muted-foreground flex items-center'>
                              <Clock className='w-3 h-3 mr-1' />
                              {formatDateShort(req.createdAt)}
                            </span>
                          </div>
                          <div>
                            <h3 className='font-medium text-lg group-hover:text-emerald-900 transition-colors'>
                              {req.title}
                            </h3>
                            <p className='text-sm text-muted-foreground'>
                              {req.make} {req.model}
                              {req.yearFrom && <> ({req.yearFrom}+)</>}
                            </p>
                          </div>
                          <div className='flex flex-wrap items-center gap-4 text-sm text-stone-600'>
                            {req.locationCity && (
                              <span className='flex items-center gap-1'>
                                <MapPin className='w-3 h-3' />
                                {req.locationCity}
                              </span>
                            )}
                            {req.budgetMax && (
                              <span className='font-medium'>
                                Budsjett:{' '}
                                {req.budgetMax.toLocaleString('nb-NO')} kr
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center'>
                          <Button
                            asChild
                            size='sm'
                            className='w-full md:w-auto bg-stone-900 text-white hover:bg-stone-800'
                          >
                            <Link href={`/dealer/requests/${req.id}`}>
                              Gi tilbud
                              <ArrowRight className='w-4 h-4 ml-2' />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Recent Offers Section */}
          <section className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h2 className='font-serif text-xl font-semibold text-stone-900'>
                Dine siste tilbud
              </h2>
              <Button variant='link' className='text-stone-600' asChild>
                <Link href='/dealer/offers'>Se all historikk</Link>
              </Button>
            </div>
            <Card className='bg-white border-stone-200'>
              {latestOffers.length === 0 ? (
                <CardContent className='p-5 text-sm text-muted-foreground'>
                  Du har ikke sendt noen tilbud ennå.
                </CardContent>
              ) : (
                <div className='divide-y divide-stone-100'>
                  {latestOffers.map(({ offer, request }) => (
                    <div
                      key={offer.id}
                      className='p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors'
                    >
                      <div className='space-y-1'>
                        <div className='flex items-center gap-2'>
                          <span className='font-medium text-stone-900'>
                            {offer.carMake} {offer.carModel}
                          </span>
                          <Badge
                            variant={
                              offer.status === 'accepted'
                                ? 'outline'
                                : offer.status === 'submitted'
                                ? 'secondary'
                                : 'outline'
                            }
                            className={
                              offer.status === 'accepted'
                                ? 'border-emerald-300 text-emerald-800'
                                : ''
                            }
                          >
                            {offer.status === 'submitted'
                              ? 'Sendt'
                              : offer.status === 'accepted'
                              ? 'Akseptert'
                              : offer.status === 'expired'
                              ? 'Utløpt'
                              : offer.status}
                          </Badge>
                        </div>
                        <p className='text-sm text-muted-foreground'>
                          Til: {request.title}
                          {request.locationCity && (
                            <> • {request.locationCity}</>
                          )}
                        </p>
                        <p className='text-xs text-stone-500'>
                          {formatDateShort(offer.createdAt)}
                        </p>
                      </div>
                      <div className='text-right space-y-1'>
                        <div className='font-semibold text-stone-900'>
                          {formatCurrencyNok(offer.priceTotal)}
                        </div>
                        <Button
                          asChild
                          variant='ghost'
                          size='sm'
                          className='h-8 text-stone-600'
                        >
                          <Link href={`/dealer/requests/${request.id}`}>
                            Se detaljer
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </div>

        {/* Sidebar / Info Area */}
        <div className='space-y-6'>
          {/* Profile Completion Card */}
          <Card className='bg-emerald-900 text-emerald-50 border-none'>
            <CardHeader>
              <CardTitle className='text-lg text-white'>Din profil</CardTitle>
              <CardDescription className='text-emerald-200'>
                Fullfør profilen din for å øke tilliten hos kjøpere.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Fullført</span>
                  <span>80%</span>
                </div>
                <div className='h-2 bg-emerald-950/50 rounded-full overflow-hidden'>
                  <div className='h-full bg-emerald-400 w-[80%]' />
                </div>
              </div>
              <div className='space-y-2'>
                <div className='flex items-center gap-2 text-sm text-emerald-100'>
                  <CheckCircle2 className='w-4 h-4 text-emerald-400' />
                  <span>Verifisert forhandler</span>
                </div>
                <div className='flex items-center gap-2 text-sm text-emerald-100/50'>
                  <AlertCircle className='w-4 h-4' />
                  <span>Legg til mer informasjon (kommer)</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant='secondary'
                size='sm'
                className='w-full bg-emerald-100 text-emerald-900 hover:bg-white'
                disabled
              >
                Fullfør profil (kommer)
              </Button>
            </CardFooter>
          </Card>

          {/* Contact Info Card – uses what exists in DB */}
          <Card className='bg-white border-stone-200'>
            <CardHeader>
              <CardTitle className='text-lg'>Kontaktinfo</CardTitle>
            </CardHeader>
            <CardContent className='text-sm space-y-4'>
              <div className='flex items-start gap-3'>
                <MapPin className='w-4 h-4 text-muted-foreground mt-0.5' />
                <div>
                  <p className='font-medium'>Adresse</p>
                  {dealership.address ? (
                    <>
                      <p className='text-muted-foreground'>
                        {dealership.address}
                      </p>
                      <p className='text-muted-foreground'>
                        {dealership.postalCode} {dealership.city}
                      </p>
                    </>
                  ) : (
                    <p className='text-muted-foreground'>
                      Ikke registrert ennå.
                    </p>
                  )}
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <Phone className='w-4 h-4 text-muted-foreground mt-0.5' />
                <div>
                  <p className='font-medium'>Telefon</p>
                  <p className='text-muted-foreground'>Ikke registrert ennå.</p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <Mail className='w-4 h-4 text-muted-foreground mt-0.5' />
                <div>
                  <p className='font-medium'>E-post</p>
                  <p className='text-muted-foreground'>Ikke registrert ennå.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                variant='outline'
                size='sm'
                className='w-full bg-transparent'
                disabled
              >
                Rediger kontaktinfo (kommer)
              </Button>
            </CardFooter>
          </Card>

          {/* Quick Tips */}
          <Card className='bg-stone-100 border-none'>
            <CardHeader>
              <CardTitle className='text-lg'>Tips for flere salg</CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground space-y-3'>
              <p>
                • Svar raskt på nye forespørsler for å øke sjansen for salg.
              </p>
              <p>• Gi tydelig info om tilstand, historikk og levering.</p>
              <p>• Skriv en personlig melding til kjøperen.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
