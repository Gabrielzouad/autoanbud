// src/app/(app)/buyer/requests/[id]/page.tsx
// or src/app/buyer/requests/[id]/page.tsx depending on your structure

import { notFound } from 'next/navigation';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { db, buyerRequests } from '@/db';
import { eq, and } from 'drizzle-orm';
import { listOffersForBuyerRequest } from '@/lib/services/offers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function BuyerRequestDetailPage({ params }: PageProps) {
  const { id } = await params;

  const user = await stackServerApp.getUser();
  if (!user) {
    notFound();
  }

  const profile = await ensureUserProfile({ id: user.id });

  // Load the request and ensure it belongs to this buyer
  const [request] = await db
    .select()
    .from(buyerRequests)
    .where(
      and(eq(buyerRequests.id, id), eq(buyerRequests.buyerId, profile.userId))
    );

  if (!request) {
    notFound();
  }

  // Load offers for this request (with dealership info)
  const offerRows = await listOffersForBuyerRequest(request.id, profile.userId);

  return (
    <div className='space-y-6'>
      {/* Request info */}
      <div>
        <h1 className='text-2xl font-semibold mb-1'>{request.title}</h1>
        <p className='text-sm text-muted-foreground'>
          {request.make} {request.model}
          {request.yearFrom && <> · {request.yearFrom}+</>}
          {request.locationCity && <> · {request.locationCity}</>}
        </p>
      </div>

      <div className='border rounded-lg bg-white p-4 text-sm space-y-2'>
        {request.description && (
          <p className='whitespace-pre-line'>{request.description}</p>
        )}
        <p className='text-xs text-muted-foreground'>
          Status: {request.status}
        </p>
      </div>

      {/* Offers section */}
      <div className='border rounded-lg bg-white p-4 space-y-3'>
        <div className='flex items-center justify-between gap-2'>
          <h2 className='text-lg font-semibold'>Offers</h2>
          <span className='text-xs text-muted-foreground'>
            {offerRows.length === 0
              ? 'No offers yet'
              : `${offerRows.length} offer${offerRows.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {offerRows.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            Dealers haven&apos;t sent any offers yet. You&apos;ll see them here
            when they respond.
          </p>
        ) : (
          <div className='space-y-3'>
            {offerRows.map(({ offer, dealership }) => (
              <div
                key={offer.id}
                className='border rounded-lg px-3 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3'
              >
                <div className='space-y-1'>
                  <div className='flex items-center gap-2'>
                    <div className='font-medium text-sm'>{dealership.name}</div>
                    <Badge
                      variant='outline'
                      className='text-[10px] uppercase tracking-wide'
                    >
                      {offer.status}
                    </Badge>
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {offer.carYear} · {offer.carKm.toLocaleString('nb-NO')} km ·{' '}
                    {offer.carMake} {offer.carModel}
                    {offer.carVariant && <> · {offer.carVariant}</>}
                    {dealership.city && <> · {dealership.city}</>}
                  </div>
                  {offer.carRegNr && (
                    <div className='text-xs text-muted-foreground'>
                      Reg.nr: {offer.carRegNr}
                    </div>
                  )}
                  {offer.shortMessageToBuyer && (
                    <p className='text-xs mt-1'>{offer.shortMessageToBuyer}</p>
                  )}
                </div>

                <div className='flex flex-col items-end gap-1'>
                  <div className='text-sm font-semibold'>
                    {offer.priceTotal.toLocaleString('nb-NO', {
                      style: 'currency',
                      currency: 'NOK',
                      maximumFractionDigits: 0,
                    })}
                  </div>
                  {/* Later: add accept / reject actions here */}
                  <Button variant='outline' size='sm' disabled>
                    Accept (coming soon)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
