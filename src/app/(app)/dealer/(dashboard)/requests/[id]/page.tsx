// src/app/dealer/(dashboard)/requests/[id]/page.tsx

import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { isValidUUID } from '@/lib/errors';

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { isDealershipAssignedToRequest } from '@/lib/services/requestAssignments';
import { db, buyerRequests } from '@/db';
import { createOfferAction } from '@/app/actions/offers';
import {
  RequestDetailsView,
  Request,
  type OfferFormState,
} from './request-details-view';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  getDealerRequestAction,
  getDealerRequestActionLabel,
} from '@/lib/services/dealerRequestActions';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function RequestDetailsPage({ params }: PageProps) {
  const { id } = await params;
  if (!isValidUUID(id)) notFound();

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

  const isAssigned = await isDealershipAssignedToRequest(id, dealerships[0].id);
  if (!isAssigned) {
    return (
      <div className='container mx-auto max-w-2xl py-12 px-4 md:px-6'>
        <Card className='border-stone-200 bg-white'>
          <CardHeader className='space-y-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-700'>
              <AlertCircle className='h-5 w-5' />
            </div>
            <CardTitle className='font-serif text-2xl text-stone-900'>
              Forespørselen er ikke tildelt din forhandler
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-5 text-sm text-stone-600'>
            <p>
              Denne forespørselen finnes, men den er ikke del av din aktive
              arbeidsliste. For å beskytte kjøperen og holde antall tilbud
              kontrollert kan bare tildelte forhandlere se detaljer og sende
              tilbud.
            </p>
            <Button asChild variant='outline' className='bg-white'>
              <Link href='/dealer/requests'>
                <ArrowLeft className='mr-2 h-4 w-4' />
                Til mine forespørsler
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  const dealerAction = await getDealerRequestAction(dealerships[0].id, id);

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
      ? ((meta as { imageUrls?: string[] }).imageUrls ?? [])
      : [];

  const request: Request = {
    id: row.id,
    title: row.title,
    requestType: row.requestType,
    make: row.make ?? 'Uspesifisert',
    model: row.model ?? '',
    yearFrom: row.yearFrom ?? null,
    budgetMax: row.budgetMax ?? 0,
    status: row.status ?? 'open',
    postedAt: createdAt.toISOString(),
    description: row.description ?? '',
    fuelType: row.fuelType ?? null,
    transmission: row.gearbox ?? null,
    imageUrls: imageUrls,
    dealerAction: dealerAction?.action,
    dealerActionLabel: getDealerRequestActionLabel(dealerAction?.action),
  };

  // Server action bound to this page
  async function action(
    _state: OfferFormState,
    formData: FormData,
  ): Promise<OfferFormState> {
    'use server';

    // Ensure requestId exists (we also set it hidden in the form, but this is a fallback)
    if (!formData.get('requestId')) {
      formData.set('requestId', request.id);
    }

    try {
      const result = await createOfferAction(formData);

      if (!result.success) {
        return {
          success: false,
          message: 'Tilbudet mangler informasjon. Sjekk feltene under.',
          errors: result.errors,
        };
      }
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Kunne ikke sende tilbudet akkurat nå.',
        errors: {},
      };
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
