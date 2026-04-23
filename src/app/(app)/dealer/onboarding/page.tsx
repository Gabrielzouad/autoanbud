import { redirect } from 'next/navigation';

import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';
import { getDealerCapability } from '@/lib/services/dealerCapabilities';
import { DealerOnboardingForm } from './DealerOnboardingForm';

export default async function DealerOnboardingPage() {
  const user = await stackServerApp.getUser();
  if (!user) {
    redirect('/handler/sign-in');
  }

  const profile = await ensureUserProfile({ id: user.id });

  if (profile.role === 'buyer') {
    redirect('/buyer/requests');
  }

  const dealerships = await getDealershipsForUser(profile.userId);
  const dealership = dealerships[0] ?? null;
  const capabilities = dealership ? await getDealerCapability(dealership.id) : null;

  return (
    <div className='max-w-4xl mx-auto'>
      <div className='bg-white border border-stone-200 rounded-xl shadow-sm p-6'>
        <DealerOnboardingForm
          dealership={dealership ?? undefined}
          initialCapabilities={capabilities ?? undefined}
        />
      </div>
    </div>
  );
}
