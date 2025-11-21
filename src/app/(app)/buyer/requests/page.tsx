import Link from 'next/link';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import {
  Plus,
  MapPin,
  Calendar,
  Car,
  Clock,
  Filter,
  Fuel,
  Gauge,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { db, buyerRequests, offers } from '@/db';

type RequestStatus =
  | 'open'
  | 'under_review'
  | 'accepted'
  | 'expired'
  | 'cancelled'
  | string;

type RequestCardModel = {
  id: string;
  title: string;
  make: string;
  model: string;
  yearFrom?: number | null;
  locationCity?: string | null;
  budgetMax?: number | null;
  status: RequestStatus;
  statusLabel: string;
  offerCount: number;
  createdAt: Date;
  image?: string;
  mileageMax?: number | null;
  fuelType?: string | null;
  transmission?: string | null;
};

function formatStatus(status: RequestStatus) {
  if (status === 'open') return 'Active';
  if (status === 'under_review') return 'Pending';
  if (status === 'accepted') return 'Accepted';
  if (status === 'expired') return 'Expired';
  if (status === 'cancelled') return 'Archived';
  return status?.toString() || 'Active';
}

function fuelLabel(fuel?: string | null) {
  if (fuel === 'petrol') return 'Petrol';
  if (fuel === 'diesel') return 'Diesel';
  if (fuel === 'hybrid') return 'Hybrid';
  if (fuel === 'ev') return 'Electric';
  if (fuel === 'other') return 'Other';
  return 'Any fuel';
}

function transmissionLabel(gear?: string | null) {
  if (gear === 'automatic') return 'Automatic';
  if (gear === 'manual') return 'Manual';
  if (gear === 'any') return 'Any';
  return 'Any';
}

export default async function BuyerRequestsPage() {
  const user = await stackServerApp.getUser();
  if (!user) return null; // layout will redirect

  const profile = await ensureUserProfile({ id: user.id });

  const requestRows = await db
    .select()
    .from(buyerRequests)
    .where(eq(buyerRequests.buyerId, profile.userId))
    .orderBy(desc(buyerRequests.createdAt));

  const requestIds = requestRows.map((r) => r.id);

  const offerCounts =
    requestIds.length === 0
      ? []
      : await db
          .select({
            requestId: offers.requestId,
            count: sql<number>`count(*)`,
          })
          .from(offers)
          .where(inArray(offers.requestId, requestIds))
          .groupBy(offers.requestId);

  const offerCountMap = new Map<string, number>(
    offerCounts.map((row) => [row.requestId, Number(row.count || 0)])
  );

  const mapRequest = (row: (typeof requestRows)[number]): RequestCardModel => {
    const createdAt =
      row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);
    const image =
      (row.meta &&
        typeof row.meta === 'object' &&
        Array.isArray((row.meta as { imageUrls?: unknown[] }).imageUrls) &&
        (row.meta as { imageUrls: unknown[] }).imageUrls.find(
          (u) => typeof u === 'string'
        )) ||
      undefined;

    return {
      id: row.id,
      title: row.title,
      make: row.make ?? 'Any',
      model: row.model ?? '',
      yearFrom: row.yearFrom,
      locationCity: row.locationCity,
      budgetMax: row.budgetMax,
      status: (row.status as RequestStatus) ?? 'open',
      statusLabel: formatStatus(row.status as RequestStatus),
      offerCount: offerCountMap.get(row.id) ?? 0,
      createdAt,
      image: image as string | undefined,
      mileageMax: row.maxKm ?? null,
      fuelType: fuelLabel(row.fuelType),
      transmission: transmissionLabel(row.gearbox),
    };
  };

  const requests = requestRows.map(mapRequest);
  const activeRequests = requests.filter(
    (r) => r.status !== 'cancelled' && r.status !== 'expired'
  );
  const archivedRequests = requests.filter(
    (r) => r.status === 'cancelled' || r.status === 'expired'
  );

  return (
    <div className='min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-7xl mx-auto space-y-8'>
        {/* Header Section */}
        <div className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='space-y-1'>
            <h1 className='text-3xl font-bold font-serif text-stone-900'>
              My Requests
            </h1>
            <p className='text-stone-600'>
              Track your car search and manage offers.
            </p>
          </div>
          <Button
            asChild
            className='bg-emerald-900 hover:bg-emerald-800 text-white shadow-sm'
          >
            <Link href='/buyer/requests/new'>
              <Plus className='mr-2 h-4 w-4' />
              New Request
            </Link>
          </Button>
        </div>

        {/* Main Content */}
        <Tabs defaultValue='active' className='w-full'>
          <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
            <TabsList className='bg-white border border-stone-200 p-1 h-auto w-fit'>
              <TabsTrigger
                value='active'
                className='data-[state=active]:bg-stone-100 data-[state=active]:text-stone-900 px-4 py-2'
              >
                Active Requests
                <Badge
                  variant='secondary'
                  className='ml-2 bg-stone-200 text-stone-700 hover:bg-stone-200'
                >
                  {activeRequests.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value='archived'
                className='data-[state=active]:bg-stone-100 data-[state=active]:text-stone-900 px-4 py-2'
              >
                Archived
                <Badge
                  variant='secondary'
                  className='ml-2 bg-stone-200 text-stone-700 hover:bg-stone-200'
                >
                  {archivedRequests.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <div className='relative w-full sm:w-64'>
              <Filter className='absolute left-2.5 top-2.5 h-4 w-4 text-stone-400' />
              <Input
                placeholder='Filter requests...'
                className='pl-9 bg-white border-stone-200 focus-visible:ring-emerald-600'
              />
            </div>
          </div>

          <TabsContent value='active' className='mt-0'>
            {activeRequests.length === 0 ? (
              <EmptyState />
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {activeRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value='archived' className='mt-0'>
            {archivedRequests.length === 0 ? (
              <EmptyState />
            ) : (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {archivedRequests.map((request) => (
                  <RequestCard key={request.id} request={request} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function RequestCard({ request }: { request: RequestCardModel }) {
  const mileageLabel =
    typeof request.mileageMax === 'number'
      ? `< ${(request.mileageMax / 1000).toFixed(0)}k km`
      : 'Any km';

  return (
    <Link href={`/buyer/requests/${request.id}`} className='block group h-full'>
      <Card className='h-full p-0 flex flex-col border-stone-200 shadow-sm hover:shadow-md transition-all duration-200 hover:border-emerald-200 overflow-hidden'>
        {/* Image Section */}
        <div className='relative h-48 bg-stone-100 shrink-0'>
          <img
            src={request.image || '/images/car-placeholder.avif'}
            alt={request.title}
            className='w-full h-full object-cover'
          />
          <div className='absolute top-3 right-3'>
            <StatusBadge status={request.statusLabel} />
          </div>
          <div className='absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4'>
            <h3 className='font-serif text-lg font-semibold text-white truncate'>
              {request.title}
            </h3>
          </div>
        </div>

        <CardContent className='flex-1  space-y-4'>
          {/* Key Specs Grid */}
          <div className='grid grid-cols-2 gap-y-3 gap-x-2 text-sm'>
            <div className='flex items-center text-stone-600'>
              <Car className='mr-2 h-4 w-4 text-emerald-600 shrink-0' />
              <span className='truncate'>
                {request.make} {request.model}
              </span>
            </div>
            <div className='flex items-center text-stone-600'>
              <Calendar className='mr-2 h-4 w-4 text-emerald-600 shrink-0' />
              <span>
                {request.yearFrom ? `${request.yearFrom}+` : 'Any year'}
              </span>
            </div>
            <div className='flex items-center text-stone-600'>
              <Fuel className='mr-2 h-4 w-4 text-emerald-600 shrink-0' />
              <span>{request.fuelType}</span>
            </div>
            <div className='flex items-center text-stone-600'>
              <Gauge className='mr-2 h-4 w-4 text-emerald-600 shrink-0' />
              <span>{mileageLabel}</span>
            </div>
            <div className='flex items-center text-stone-600 col-span-2'>
              <MapPin className='mr-2 h-4 w-4 text-emerald-600 shrink-0' />
              <span className='truncate'>
                {request.locationCity ?? 'Anywhere'}
              </span>
            </div>
          </div>

          <Separator className='bg-stone-100' />

          <div className='flex justify-between items-end'>
            <div className='space-y-1'>
              <div className='text-xs text-stone-500 uppercase tracking-wider font-medium'>
                Budget
              </div>
              <div className='font-semibold text-stone-900 text-lg'>
                {request.budgetMax
                  ? request.budgetMax.toLocaleString('nb-NO', {
                      style: 'currency',
                      currency: 'NOK',
                      maximumFractionDigits: 0,
                    })
                  : '—'}
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className='p-4 pt-0 mt-auto border-t border-stone-50 bg-stone-50/50 flex items-center justify-between'>
          <div className='flex items-center text-xs text-stone-400 mt-4'>
            <Clock className='mr-1.5 h-3.5 w-3.5' />
            {request.createdAt.toLocaleDateString('nb-NO')}
          </div>
          <div className='flex items-center gap-3 mt-4'>
            {request.offerCount > 0 ? (
              <Badge className='bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 px-2.5'>
                {request.offerCount}{' '}
                {request.offerCount === 1 ? 'Offer' : 'Offers'}
              </Badge>
            ) : (
              <span className='text-xs text-stone-400 font-medium'>
                Ingen tilbud enda
              </span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant='secondary'
      className={
        status === 'Active'
          ? 'bg-white/90 text-emerald-800 backdrop-blur-sm shadow-sm'
          : status === 'Pending'
          ? 'bg-white/90 text-amber-800 backdrop-blur-sm shadow-sm'
          : status === 'Accepted'
          ? 'bg-white/90 text-emerald-700 backdrop-blur-sm shadow-sm'
          : 'bg-white/90 text-stone-600 backdrop-blur-sm shadow-sm'
      }
    >
      {status}
    </Badge>
  );
}

function EmptyState() {
  return (
    <Card className='border-dashed border-2 border-stone-200 bg-stone-50/50'>
      <CardContent className='flex flex-col items-center justify-center py-16 text-center space-y-4'>
        <div className='p-4 bg-white rounded-full shadow-sm'>
          <Car className='h-8 w-8 text-stone-400' />
        </div>
        <div className='space-y-1'>
          <h3 className='text-lg font-medium text-stone-900'>
            Ingen forespørsler enda
          </h3>
          <p className='text-stone-500 max-w-sm mx-auto'>
            Du har ikke opprettet noen bilforespørsler ennå. Kom i gang ved å
            opprette en ny forespørsel.
          </p>
        </div>
        <Button asChild variant='outline' className='mt-4 bg-transparent'>
          <Link href='/buyer/requests/new'>Opprett Forespørsel</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
