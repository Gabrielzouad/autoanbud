// src/app/dealer/(dashboard)/requests/page.tsx

import { RequestsView } from './RequestView';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { getDealerCapability } from '@/lib/services/dealerCapabilities';
import { getAssignedRequestsForDealer } from '@/lib/services/requestAssignments';
import {
  getDealerRequestActionLabel,
  getDealerRequestActionMap,
  type DealerRequestActionType,
} from '@/lib/services/dealerRequestActions';

function getActionPriority(action?: DealerRequestActionType) {
  if (action === 'interested') return 2;
  if (action === 'bookmarked') return 1;
  if (action === 'declined') return -1;
  return 0;
}

export default async function DealerRequestsPage() {
  const user = await stackServerApp.getUser();
  if (!user) return null; // layout should redirect

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);
  if (dealerships.length === 0) return null; // layout → onboarding

  const capabilities = await getDealerCapability(dealerships[0].id);

  // Fetch requests explicitly assigned to this dealer
  const assignedRequests = await getAssignedRequestsForDealer(
    dealerships[0].id,
    100,
  );
  const actionMap = await getDealerRequestActionMap(
    dealerships[0].id,
    assignedRequests.map(({ request }) => request.id),
  );

  const initialRequests = assignedRequests
    .map(({ request }) => {
      const dealerAction = actionMap.get(request.id)?.action;
      const firstImage =
        Array.isArray(
          (request as { meta?: { imageUrls?: unknown } }).meta?.imageUrls,
        ) &&
        (request as { meta?: { imageUrls?: unknown[] } }).meta?.imageUrls
          ?.length
          ? (request as { meta: { imageUrls: unknown[] } }).meta.imageUrls[0]
          : undefined;

      return {
        id: request.id,
        title: request.title,
        requestType: request.requestType,
        make: request.make ?? 'Uspesifisert',
        model: request.model ?? '',
        yearFrom: request.yearFrom ?? undefined,
        budgetMax: request.budgetMax ?? 0,
        status: request.status, // e.g. "open"
        postedAt: (request.createdAt as Date).toISOString(),
        description: request.description ?? '',
        fuelType: request.fuelType ?? undefined,
        transmission: request.gearbox ?? undefined,
        locationCity: request.locationCity ?? 'Uspesifisert',
        matchScore: 0,
        qualityScore:
          typeof request.qualityScore === 'number' && request.qualityScore > 0
            ? request.qualityScore
            : undefined,
        dealerAction,
        dealerActionLabel: getDealerRequestActionLabel(dealerAction),
        imageUrl: typeof firstImage === 'string' ? firstImage : undefined,
      };
    })
    .filter((request) => request.dealerAction !== 'declined')
    .sort((a, b) => {
      return getActionPriority(b.dealerAction) - getActionPriority(a.dealerAction);
    });

  return (
    <div className='container mx-auto py-8 px-4 md:px-6 space-y-8'>
      <div className='flex flex-col gap-2'>
        <h1 className='text-3xl font-serif font-bold text-stone-900'>
          Mine tildelte forespørsler
        </h1>
        <p className='text-stone-600 max-w-2xl'>
          Se forespørsler som er tildelt din forhandler. Dette gir en kuratert
          arbeidsliste og reduserer uønskede tilbud.
        </p>
        {capabilities?.makes?.length ? (
          <p className='text-sm text-stone-500'>
            Vises kun for valgt(e) merke(r): {capabilities.makes.join(', ')}.
          </p>
        ) : null}
      </div>

      <RequestsView initialRequests={initialRequests} />
    </div>
  );
}
