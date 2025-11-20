// src/app/dealer/(dashboard)/offers/page.tsx

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { listOffersForDealershipWithRequest } from '@/lib/services/offers';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default async function DealerOffersPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    // Dealer layout already guards in practice, but this is a safety net
    return null;
  }

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);
  if (dealerships.length === 0) {
    return null;
  }

  const dealership = dealerships[0];
  const rows = await listOffersForDealershipWithRequest(dealership.id);

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold'>My offers</h1>
          <p className='text-sm text-muted-foreground'>
            Offers you&apos;ve sent in response to buyer requests.
          </p>
        </div>
        <div className='text-xs text-muted-foreground text-right'>
          <div>{dealership.name}</div>
          {dealership.city && <div>{dealership.city}</div>}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className='border border-dashed rounded-lg p-6 text-sm text-muted-foreground bg-white'>
          You haven&apos;t sent any offers yet. Go to{' '}
          <Link href='/dealer/requests' className='underline'>
            buyer requests
          </Link>{' '}
          to respond.
        </div>
      ) : (
        <div className='space-y-3'>
          {rows.map(({ offer, request }) => (
            <div
              key={offer.id}
              className='border rounded-lg bg-white px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:border-slate-400 transition'
            >
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <div className='font-medium text-sm'>{request.title}</div>
                  <Badge
                    variant='outline'
                    className='text-[10px] uppercase tracking-wide'
                  >
                    {offer.status}
                  </Badge>
                </div>
                <div className='text-xs text-muted-foreground'>
                  {request.make} {request.model}
                  {request.yearFrom && <> · {request.yearFrom}+</>}
                  {request.locationCity && <> · {request.locationCity}</>}
                </div>
                {offer.carRegNr && (
                  <div className='text-xs text-muted-foreground'>
                    Reg: {offer.carRegNr}
                  </div>
                )}
              </div>

              <div className='flex items-end md:items-center gap-4 justify-between md:justify-end'>
                <div className='text-right'>
                  <div className='text-sm font-semibold'>
                    {offer.priceTotal.toLocaleString('nb-NO', {
                      style: 'currency',
                      currency: 'NOK',
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  <div className='text-[11px] text-muted-foreground mt-1'>
                    {offer.carYear} · {offer.carKm.toLocaleString('nb-NO')} km
                  </div>
                </div>

                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <Link href={`/buyer/requests/${request.id}`}>
                      View request
                    </Link>
                  </Button>
                  {/* Later: link to offer detail */}
                  {/* <Button size="sm" asChild>
                    <Link href={`/dealer/offers/${offer.id}`}>Details</Link>
                  </Button> */}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
