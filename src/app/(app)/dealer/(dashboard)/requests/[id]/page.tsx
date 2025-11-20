// src/app/dealer/(dashboard)/requests/[id]/page.tsx

import { notFound, redirect } from 'next/navigation';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { db, buyerRequests } from '@/db';
import { eq } from 'drizzle-orm';
import { createOfferAction } from '@/app/actions/offers';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DealerRequestDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Auth check
  const user = await stackServerApp.getUser();
  if (!user) notFound();

  // Ensure user profile
  const profile = await ensureUserProfile({ id: user.id });

  // Find dealership for the dealer (must exist due to layout guard)
  const dealerships = await getDealershipsForUser(profile.userId);
  if (dealerships.length === 0) notFound();

  // Load the buyer request
  const [request] = await db
    .select()
    .from(buyerRequests)
    .where(eq(buyerRequests.id, id));

  if (!request) notFound();

  // Server action (inside the page)
  async function action(formData: FormData) {
    'use server';

    const result = await createOfferAction(formData);

    if (!result.success) {
      console.error(result.errors);
      throw new Error('Validation failed');
    }

    // Redirect after successful offer creation
    redirect('/dealer/requests');
    // or later: redirect(`/dealer/offers/${result.offerId}`);
  }

  return (
    <div className='space-y-6'>
      {/* Request summary */}
      <div className='border rounded-lg bg-white p-4 space-y-1'>
        <h1 className='text-xl font-semibold'>{request.title}</h1>
        <p className='text-sm text-muted-foreground'>
          {request.make} {request.model}
          {request.yearFrom && <> · {request.yearFrom}+</>}
          {request.locationCity && <> · {request.locationCity}</>}
        </p>

        {request.description && (
          <p className='text-sm mt-2 whitespace-pre-line'>
            {request.description}
          </p>
        )}
      </div>

      {/* Offer form */}
      <div className='border rounded-lg bg-white p-4 space-y-4'>
        <h2 className='text-lg font-semibold'>Send offer</h2>

        <form action={action} className='space-y-4'>
          {/* Hidden requestId */}
          <input type='hidden' name='requestId' value={request.id} />

          {/* Make / Model */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='carMake'>Make</Label>
              <Input
                id='carMake'
                name='carMake'
                defaultValue={request.make}
                required
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='carModel'>Model</Label>
              <Input
                id='carModel'
                name='carModel'
                defaultValue={request.model}
                required
              />
            </div>
          </div>

          {/* Year / Km / Price */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='carYear'>Year</Label>
              <Input id='carYear' name='carYear' type='number' required />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='carKm'>Km</Label>
              <Input id='carKm' name='carKm' type='number' required />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='priceTotal'>Price (NOK)</Label>
              <Input id='priceTotal' name='priceTotal' type='number' required />
            </div>
          </div>

          {/* Variant */}
          <div className='space-y-1.5'>
            <Label htmlFor='carVariant'>Variant / trim</Label>
            <Input
              id='carVariant'
              name='carVariant'
              placeholder='T8 Recharge Inscription'
            />
          </div>

          {/* Reg / Colors */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='carRegNr'>Reg. number</Label>
              <Input id='carRegNr' name='carRegNr' placeholder='AB12345' />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='colorExterior'>Exterior color</Label>
              <Input
                id='colorExterior'
                name='colorExterior'
                placeholder='Black metallic'
              />
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='colorInterior'>Interior</Label>
              <Input
                id='colorInterior'
                name='colorInterior'
                placeholder='Light leather'
              />
            </div>
          </div>

          {/* Message to buyer */}
          <div className='space-y-1.5'>
            <Label htmlFor='shortMessageToBuyer'>Message to buyer</Label>
            <Textarea
              id='shortMessageToBuyer'
              name='shortMessageToBuyer'
              rows={3}
              placeholder='Explain why this car fits their needs, delivery time, etc.'
            />
          </div>

          <div className='pt-2'>
            <Button type='submit'>Send offer</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
