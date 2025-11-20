// src/app/dealer/(dashboard)/requests/page.tsx

import { RequestsView } from './RequestView';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { listOpenBuyerRequests } from '@/lib/services/dealerRequests';

export default async function DealerRequestsPage() {
  const user = await stackServerApp.getUser();
  if (!user) return null; // layout should redirect

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);
  if (dealerships.length === 0) return null; // layout → onboarding

  // Fetch all open buyer requests from the marketplace
  const dbRequests = await listOpenBuyerRequests();

  // Map DB rows into the shape RequestsView expects
  const initialRequests = dbRequests.map((r) => ({
    id: r.id,
    title: r.title,
    make: r.make ?? 'Uspesifisert',
    model: r.model ?? '',
    yearFrom: r.yearFrom ?? undefined,
    locationCity: r.locationCity ?? 'Uspesifisert',
    budgetMax: r.budgetMax ?? 0,
    status: r.status, // e.g. "open"
    postedAt: (r.createdAt as Date).toISOString(),
    description: r.description ?? '',
    fuelType: r.fuelType ?? undefined,
    transmission: r.gearbox ?? undefined,
  }));

  return (
    <div className='container mx-auto py-8 px-4 md:px-6 space-y-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-serif font-bold text-stone-900'>
          Markedsplass – forespørsler
        </h1>
        <p className='text-stone-600 max-w-2xl'>
          Se aktive forespørsler fra kjøpere. Filtrer på sted, budsjett og
          biltype for å finne de som passer lageret ditt.
        </p>
      </div>

      <RequestsView initialRequests={initialRequests} />
    </div>
  );
}
