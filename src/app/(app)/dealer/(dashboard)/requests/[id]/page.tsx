// src/app/dealer/(dashboard)/requests/[id]/page.tsx

import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { db, buyerRequests } from '@/db';
import { createOfferAction } from '@/app/actions/offers';
import { RequestDetailsView, Request } from './request-details-view';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailsPage({ params }: PageProps) {
  const { id } = await params;

  // Auth + dealer guard
  const user = await stackServerApp.getUser();
  if (!user) notFound();

  const profile = await ensureUserProfile({ id: user.id });
  const dealerships = await getDealershipsForUser(profile.userId);
  if (dealerships.length === 0) notFound();

  // Load the buyer request
  const [row] = await db
    .select()
    .from(buyerRequests)
    .where(eq(buyerRequests.id, id));

  if (!row) notFound();

  const createdAt =
    row.createdAt instanceof Date ? row.createdAt : new Date(row.createdAt);

  const meta = row.meta as unknown;

  const imageUrls =
    Array.isArray((meta as { imageUrls?: unknown })?.imageUrls) &&
    (
      (meta as { imageUrls?: { length?: number } })?.imageUrls as {
        length?: number;
      }
    )?.length
      ? (meta as { imageUrls?: string[] }).imageUrls ?? []
      : [];

  const request: Request = {
    id: row.id,
    title: row.title,
    make: row.make ?? 'Uspesifisert',
    model: row.model ?? '',
    yearFrom: row.yearFrom ?? null,
    locationCity: row.locationCity ?? 'Uspesifisert',
    budgetMax: row.budgetMax ?? 0,
    status: row.status ?? 'open',
    postedAt: createdAt.toISOString(),
    description: row.description ?? '',
    fuelType: row.fuelType ?? null,
    transmission: row.gearbox ?? null,
    imageUrls: imageUrls,
  };

  // Server action bound to this page
  async function action(formData: FormData) {
    'use server';

    // Ensure requestId exists (we also set it hidden in the form, but this is a fallback)
    if (!formData.get('requestId')) {
      formData.set('requestId', request.id);
    }

    const result = await createOfferAction(formData);

    if (!result.success) {
      console.error(result.errors);
      // Later: return error to client state instead of throwing
      throw new Error('Validering feilet');
    }

    // After successful offer creation, go to offers overview
    redirect('/dealer/offers');
  }

  return (
    <div className='container mx-auto py-8 px-4 md:px-6'>
      <RequestDetailsView request={request} action={action} />
    </div>
  );
}
