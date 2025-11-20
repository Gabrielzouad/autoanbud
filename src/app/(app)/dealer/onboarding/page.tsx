// src/app/dealer/onboarding/page.tsx
import { redirect } from 'next/navigation';
import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { dealerOnboardingAction } from '@/app/actions/dealerOnboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default async function DealerOnboardingPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect('/handler/sign-in');
  }

  const profile = await ensureUserProfile({ id: user.id });
  const existing = await getDealershipsForUser(profile.userId);

  if (existing.length > 0) {
    // Already onboarded → go to dealer dashboard
    redirect('/dealer');
  }

  async function action(formData: FormData) {
    'use server';

    const result = await dealerOnboardingAction(formData);
    if (!result.success) {
      // For MVP, just log; later you can handle errors
      console.error(result.errors);
      throw new Error('Validation failed');
    }

    redirect('/dealer');
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-50 px-4'>
      <div className='w-full max-w-md bg-white border rounded-lg shadow-sm p-6 space-y-5'>
        <div>
          <h1 className='text-xl font-semibold'>Register dealership</h1>
          <p className='text-sm text-muted-foreground mt-1'>
            Connect your dealership to start receiving buyer requests.
          </p>
        </div>

        <form action={action} className='space-y-4'>
          <div className='space-y-1.5'>
            <Label htmlFor='name'>Dealership name</Label>
            <Input
              id='name'
              name='name'
              placeholder='Example Bil AS'
              required
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='orgNumber'>Org. number</Label>
            <Input
              id='orgNumber'
              name='orgNumber'
              placeholder='123 456 789'
              required
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='address'>Address</Label>
            <Input id='address' name='address' placeholder='Storgata 1' />
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='postalCode'>Postal code</Label>
              <Input id='postalCode' name='postalCode' placeholder='0001' />
            </div>
            <div className='space-y-1.5'>
              <Label htmlFor='city'>City</Label>
              <Input id='city' name='city' placeholder='Oslo' />
            </div>
          </div>

          <div className='pt-2'>
            <Button type='submit' className='w-full'>
              Register dealership
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
