// src/app/dealer/(dashboard)/offers/page.tsx

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { listOffersForDealershipWithRequest } from '@/lib/services/offers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { OfferCard, OffersView } from './OffersView';

export default async function DealerOffersPage() {
  const user = await stackServerApp.getUser();
  if (!user) return null; // layout will redirect

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);
  if (dealerships.length === 0) return null; // layout → onboarding

  const dealership = dealerships[0];

  // Load offers for this dealership + the linked buyer request
  const rows = await listOffersForDealershipWithRequest(dealership.id);

  const initialOffers: OfferCard[] = rows.map(({ offer, request }) => {
    const createdAt =
      offer.createdAt instanceof Date
        ? offer.createdAt
        : new Date(offer.createdAt);

    // Simple expiry rule for now: 7 days after created
    const expiresAt = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000);

    return {
      id: offer.id,
      status: offer.status, // "submitted" | "accepted" | "expired" | etc.
      priceTotal: offer.priceTotal ?? 0,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      car: {
        make: offer.carMake ?? request.make ?? 'Uspesifisert',
        model: offer.carModel ?? request.model ?? '',
        year: offer.carYear ?? undefined,
        regNr: offer.carRegNr ?? '',
        km: offer.carKm ?? 0,
        image: (() => {
          const meta = request.meta as Record<string, unknown> | undefined;
          const urls = meta?.imageUrls;
          if (!Array.isArray(urls) || urls.length === 0) return null;
          const first = urls[0];
          return typeof first === 'string' ? first : null;
        })(),
      },
      request: {
        id: request.id,
        title: request.title,
        buyerName: 'Kjøper via BilMarked', // we don't have buyer name yet
        location: request.locationCity ?? 'Uspesifisert',
      },
    };
  });

  return (
    <div className='space-y-8'>
      <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-serif font-medium text-emerald-950'>
            Mine tilbud
          </h1>
          <p className='text-stone-500 mt-1'>
            Administrer og følg opp tilbud du har sendt til potensielle kjøpere.
          </p>
        </div>
        <Button
          className='bg-emerald-900 hover:bg-emerald-800 text-white'
          asChild
        >
          <Link href='/dealer/requests'>Finn nye forespørsler</Link>
        </Button>
      </div>

      <OffersView initialOffers={initialOffers} />
    </div>
  );
}
