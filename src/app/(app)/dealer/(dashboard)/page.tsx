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
  Star,
  Zap,
  Phone,
  Mail,
  Building2,
  Bookmark,
  ThumbsUp,
  BarChart3,
  Percent,
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
import { NoImageAvailable } from '@/components/NoImageAvailable';
import { DealerReputationBadges } from '@/components/DealerReputationBadges';

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { getDealerCapability } from '@/lib/services/dealerCapabilities';
import { getMatchingBuyerRequestsForDealer } from '@/lib/algorithms/carMatching';
import { listOffersForDealershipWithRequest } from '@/lib/services/offers';
import { getAssignedRequestsForDealer } from '@/lib/services/requestAssignments';
import {
  formatDealerRating,
  formatResponseMinutes,
  getDealerReputationSnapshot,
} from '@/lib/services/dealerReputation';
import {
  getDealerRequestActionLabel,
  getDealerRequestActionMap,
  type DealerRequestActionType,
} from '@/lib/services/dealerRequestActions';
import { getDealerPerformanceDashboardMetrics } from '@/lib/services/dealerPerformance';
import { DealerPerformanceMetricsClient } from './DealerPerformanceMetricsClient';
import EditContactModal from '@/components/EditContactModal';
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

function getFirstImage(meta: unknown): string | null {
  if (
    meta &&
    typeof meta === 'object' &&
    Array.isArray((meta as { imageUrls?: unknown }).imageUrls) &&
    (meta as { imageUrls?: unknown[] }).imageUrls?.length
  ) {
    const [first] = (meta as { imageUrls: unknown[] }).imageUrls;
    return typeof first === 'string' ? first : null;
  }
  return null;
}

function getActionPriority(action?: DealerRequestActionType) {
  if (action === 'interested') return 2;
  if (action === 'bookmarked') return 1;
  if (action === 'declined') return -1;
  return 0;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return '0%';
  return `${value}%`;
}

function formatMetricNumber(value: number | null | undefined) {
  if (value === null || value === undefined) return 'Ikke nok data';
  return value.toLocaleString('nb-NO');
}

export default async function DealerDashboardPage() {
  const user = await stackServerApp.getUser();
  if (!user) return null; // layout will redirect

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);

  if (dealerships.length === 0) return null; // layout will redirect to onboarding

  const dealership = dealerships[0];
  const capabilities = await getDealerCapability(dealership.id);

  // Real data: open buyer requests (global) + offers for this dealership
  const [
    assignedRequests,
    offerRows,
    matchedScores,
    reputationSnapshot,
    performanceSnapshot,
  ] =
    await Promise.all([
      getAssignedRequestsForDealer(dealership.id, 100),
      listOffersForDealershipWithRequest(dealership.id),
      getMatchingBuyerRequestsForDealer(dealership.id, 100),
      getDealerReputationSnapshot(dealership.id),
      getDealerPerformanceDashboardMetrics(dealership.id),
    ]);
  const performanceMetrics = performanceSnapshot.metrics;

  const matchScoreMap = new Map(
    matchedScores.map((match) => [match.requestId, match.score]),
  );
  const assignedRequestRows = assignedRequests.map(({ request }) => request);
  const requestActionMap = await getDealerRequestActionMap(
    dealership.id,
    assignedRequestRows.map((request) => request.id),
  );
  const matchedRequests = assignedRequestRows
    .filter(
      (req) =>
        matchScoreMap.has(req.id) &&
        requestActionMap.get(req.id)?.action !== 'declined',
    )
    .sort((a, b) => {
      const actionDelta =
        getActionPriority(requestActionMap.get(b.id)?.action) -
        getActionPriority(requestActionMap.get(a.id)?.action);
      if (actionDelta !== 0) return actionDelta;

      return (matchScoreMap.get(b.id) || 0) - (matchScoreMap.get(a.id) || 0);
    });

  // Stats derived from real data
  const interestedRequestsCount = Array.from(requestActionMap.values()).filter(
    (action) => action.action === 'interested',
  ).length;
  const bookmarkedRequestsCount = Array.from(requestActionMap.values()).filter(
    (action) => action.action === 'bookmarked',
  ).length;
  const matchedRequestsCount = matchedRequests.length;
  const completedMatches = performanceMetrics.completedDeals;
  const responseRate = performanceMetrics.responseRate;
  const avgResponseTime = formatResponseMinutes(performanceMetrics.averageResponseMinutes);
  const reputationBadges = reputationSnapshot?.badges ?? [];
  const ratingLabel = formatDealerRating(dealership.ratingAverage);
  const isVerified = dealership.verificationState === 'verified';
  const hasContactInfo = Boolean(dealership.phone && dealership.email);
  const profileCompletion = Math.min(
    100,
    40 +
      (isVerified ? 20 : 0) +
      (capabilities?.makes?.length ? 15 : 0) +
      (hasContactInfo ? 15 : 0) +
      (completedMatches > 0 ? 10 : 0),
  );

  const stats = {
    openRequests: performanceMetrics.openAssignments,
    activeOffers: performanceMetrics.activeOffers,
    completedMatches,
    responseRate,
    avgResponseTime,
  };

  const latestOffers = offerRows.slice(0, 3);

  return (
    <div className='min-h-screen bg-stone-50/50 p-6 md:p-8 space-y-8'>
      <DealerPerformanceMetricsClient
        dealershipId={dealership.id}
        metrics={performanceMetrics}
      />
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
            {reputationBadges.length > 0 ? (
              <DealerReputationBadges badges={reputationBadges} compact />
            ) : dealership.verificationState === 'pending' ? (
              <Badge
                variant='outline'
                className='gap-1 border-amber-300 text-amber-800'
              >
                <Clock className='w-3 h-3' />
                Verifisering pågår
              </Badge>
            ) : (
              <Badge
                variant='outline'
                className='gap-1 border-stone-300 text-stone-600'
              >
                <AlertCircle className='w-3 h-3' />
                Ikke verifisert
              </Badge>
            )}
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
            {capabilities?.makes?.length ? (
              <div className='flex items-center gap-1.5'>
                <CarFront className='w-4 h-4 text-emerald-600' />
                Matcher bilmerker: {capabilities.makes.join(', ')}
              </div>
            ) : null}
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
          <Button asChild variant='outline' className='bg-white'>
            <Link href='/dealer/onboarding'>Rediger profil</Link>
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
                {performanceMetrics.assignedLast7Days} siste 7d
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
                Fullførte matcher
              </p>
              <CheckCircle2 className='h-4 w-4 text-emerald-600' />
            </div>
            <div className='flex items-baseline gap-2'>
              <div className='text-2xl font-bold'>{stats.completedMatches}</div>
              <span className='text-xs text-muted-foreground'>
                Fullførte matcher
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className='bg-white border-stone-200 shadow-sm'>
          <CardContent className='p-6'>
            <div className='flex items-center justify-between space-y-0 pb-2'>
              <p className='text-sm font-medium text-muted-foreground'>
                Svarprosent
              </p>
              <Zap className='h-4 w-4 text-amber-600' />
            </div>
            <div className='flex items-baseline gap-2'>
              <div className='text-2xl font-bold'>{stats.responseRate}%</div>
              <span className='text-xs text-muted-foreground'>
                av tildelte leads
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className='space-y-4'>
        <div>
          <h2 className='font-serif text-xl font-semibold text-stone-900'>
            Performance
          </h2>
          <p className='text-sm text-muted-foreground mt-1'>
            Målinger for lead-kvalitet, respons og tilbudsarbeid.
          </p>
        </div>
        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <Card className='bg-white border-stone-200 shadow-sm'>
            <CardContent className='p-5'>
              <div className='flex items-center justify-between pb-2'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Akseptrate
                </p>
                <Percent className='h-4 w-4 text-emerald-600' />
              </div>
              <div className='text-2xl font-bold'>
                {formatPercent(performanceMetrics.acceptanceRate)}
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                {performanceMetrics.acceptedOffers} av{' '}
                {performanceMetrics.submittedOffers} tilbud
              </p>
            </CardContent>
          </Card>

          <Card className='bg-white border-stone-200 shadow-sm'>
            <CardContent className='p-5'>
              <div className='flex items-center justify-between pb-2'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Snitt svartid
                </p>
                <Clock className='h-4 w-4 text-amber-600' />
              </div>
              <div className='text-2xl font-bold'>{stats.avgResponseTime}</div>
              <p className='mt-1 text-xs text-muted-foreground'>
                Fra tildeling til første tilbud
              </p>
            </CardContent>
          </Card>

          <Card className='bg-white border-stone-200 shadow-sm'>
            <CardContent className='p-5'>
              <div className='flex items-center justify-between pb-2'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Tilbudskvalitet
                </p>
                <BarChart3 className='h-4 w-4 text-blue-600' />
              </div>
              <div className='text-2xl font-bold'>
                {formatMetricNumber(performanceMetrics.averageOfferQuality)}
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                Snittscore på innsendte tilbud
              </p>
            </CardContent>
          </Card>

          <Card className='bg-white border-stone-200 shadow-sm'>
            <CardContent className='p-5'>
              <div className='flex items-center justify-between pb-2'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Arbeidsliste
                </p>
                <Bookmark className='h-4 w-4 text-stone-600' />
              </div>
              <div className='text-2xl font-bold'>
                {performanceMetrics.interestedRequests +
                  performanceMetrics.savedRequests}
              </div>
              <p className='mt-1 text-xs text-muted-foreground'>
                {performanceMetrics.interestedRequests} interessert ·{' '}
                {performanceMetrics.savedRequests} lagret ·{' '}
                {performanceMetrics.declinedRequests} avslått
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className='grid gap-8 lg:grid-cols-3'>
        {/* Main Content Area */}
        <div className='lg:col-span-2 space-y-8'>
          {/* Action Required Section */}
          <section className='space-y-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h2 className='font-serif text-xl font-semibold text-stone-900'>
                  Nye forespørsler som matcher deg
                </h2>
                <p className='text-sm text-muted-foreground mt-1'>
                  Viser kun forespørsler som matcher ditt nåværende bilutvalg og
                  forhandlerens evne til å levere.
                </p>
              </div>
              <Button variant='link' className='text-emerald-900' asChild>
                <Link href='/dealer/requests'>
                  Se alle ({matchedRequestsCount})
                </Link>
              </Button>
            </div>
            {(interestedRequestsCount > 0 || bookmarkedRequestsCount > 0) && (
              <div className='flex flex-wrap items-center gap-2'>
                {interestedRequestsCount > 0 && (
                  <Badge
                    variant='outline'
                    className='bg-emerald-50 text-emerald-800 border-emerald-200'
                  >
                    <ThumbsUp className='h-3.5 w-3.5' />
                    {interestedRequestsCount} interessert
                  </Badge>
                )}
                {bookmarkedRequestsCount > 0 && (
                  <Badge
                    variant='outline'
                    className='bg-amber-50 text-amber-800 border-amber-200'
                  >
                    <Bookmark className='h-3.5 w-3.5' />
                    {bookmarkedRequestsCount} lagret
                  </Badge>
                )}
              </div>
            )}
            <div className='grid gap-4'>
              {matchedRequests.length === 0 ? (
                <Card className='bg-white border-stone-200'>
                  <CardContent className='p-5 text-sm text-muted-foreground space-y-3'>
                    <p>
                      Ingen åpne forespørsler matcher ditt nåværende bilutvalg
                      akkurat nå.
                    </p>
                    <Button asChild size='sm'>
                      <Link href='/dealer/onboarding'>Endre bilutvalg</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                matchedRequests.slice(0, 4).map((req) => {
                  const firstImage = getFirstImage(req.meta);
                  const dealerAction = requestActionMap.get(req.id)?.action;
                  const dealerActionLabel =
                    getDealerRequestActionLabel(dealerAction);

                  return (
                  <Card
                    key={req.id}
                    className='bg-white border-stone-200 hover:border-emerald-200 transition-colors cursor-pointer group'
                  >
                    <CardContent className='p-5'>
                      <div className='flex flex-col md:flex-row gap-4 justify-between'>
                        <div className='flex gap-4 min-w-0'>
                          <div className='hidden md:block w-28 h-20 rounded-lg overflow-hidden border border-stone-200 bg-stone-100'>
                            {firstImage ? (
                              <img
                                src={firstImage}
                                alt='Referansebilde'
                                className='w-full h-full object-cover'
                              />
                            ) : (
                              <NoImageAvailable className='text-[10px] [&_svg]:h-4 [&_svg]:w-4' />
                            )}
                          </div>
                          <div className='space-y-2 min-w-0'>
                            <div className='flex items-center gap-2'>
                              {dealerActionLabel && (
                                <Badge
                                  variant='outline'
                                  className={
                                    dealerAction === 'interested'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-amber-50 text-amber-800 border-amber-200'
                                  }
                                >
                                  {dealerAction === 'interested' ? (
                                    <ThumbsUp className='h-3.5 w-3.5' />
                                  ) : (
                                    <Bookmark className='h-3.5 w-3.5' />
                                  )}
                                  {dealerActionLabel}
                                </Badge>
                              )}
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
                              <h3 className='font-medium text-lg group-hover:text-emerald-900 transition-colors truncate'>
                                {req.title}
                              </h3>
                              <p className='text-sm text-muted-foreground'>
                                {req.make} {req.model}
                                {req.yearFrom && <> ({req.yearFrom}+)</>}
                              </p>
                            </div>
                            <div className='flex flex-wrap items-center gap-4 text-sm text-stone-600'>
                              {req.budgetMax && (
                                <span className='font-medium'>
                                  Budsjett:{' '}
                                  {req.budgetMax.toLocaleString('nb-NO')} kr
                                </span>
                              )}
                            </div>
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
                  );
                })
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
                Omdømme og tillitssignaler som vises for kjøpere.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Fullført</span>
                  <span>{profileCompletion}%</span>
                </div>
                <div className='h-2 bg-emerald-950/50 rounded-full overflow-hidden'>
                  <div
                    className='h-full bg-emerald-400'
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
              </div>
              <div className='space-y-3'>
                {reputationBadges.length > 0 ? (
                  <DealerReputationBadges badges={reputationBadges} />
                ) : (
                  <div className='flex items-center gap-2 text-sm text-emerald-100/70'>
                    <AlertCircle className='w-4 h-4' />
                    <span>Ingen omdømmebadges ennå</span>
                  </div>
                )}
                <div className='grid grid-cols-1 gap-2 text-sm text-emerald-100'>
                  <div className='flex items-center gap-2'>
                    <Star className='w-4 h-4 text-emerald-300' />
                    <span>Vurdering: {ratingLabel}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Clock className='w-4 h-4 text-emerald-300' />
                    <span>Snitt svartid: {stats.avgResponseTime}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Zap className='w-4 h-4 text-emerald-300' />
                    <span>Svarprosent: {stats.responseRate}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                asChild
                variant='secondary'
                size='sm'
                className='w-full bg-emerald-100 text-emerald-900 hover:bg-white'
              >
                <Link href='/dealer/onboarding'>Rediger forhandler profil</Link>
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
                  <p className='text-muted-foreground'>
                    {dealership.phone ?? 'Ikke registrert ennå.'}
                  </p>
                </div>
              </div>
              <div className='flex items-start gap-3'>
                <Mail className='w-4 h-4 text-muted-foreground mt-0.5' />
                <div>
                  <p className='font-medium'>E-post</p>
                  <p className='text-muted-foreground'>
                    {dealership.email ?? 'Ikke registrert ennå.'}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <EditContactModal
                dealershipId={dealership.id}
                current={{
                  address: dealership.address,
                  city: dealership.city,
                  postalCode: dealership.postalCode,
                  phone: dealership.phone,
                  email: dealership.email,
                }}
              />
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
