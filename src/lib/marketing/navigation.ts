import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';

export type MarketingNavigationState = {
  headerPrimaryHref: string;
  headerPrimaryLabel: string;
  headerSecondaryHref: string | null;
  headerSecondaryLabel: string | null;
  heroBuyerHref: string;
  heroBuyerLabel: string;
  heroDealerHref: string;
  heroDealerLabel: string;
  userRole: 'buyer' | 'dealer' | 'admin' | null;
};

export async function getMarketingNavigationState(): Promise<MarketingNavigationState> {
  const user = await stackServerApp.getUser();

  if (!user) {
    return {
      headerPrimaryHref: '/handler/sign-in',
      headerPrimaryLabel: 'Logg inn',
      headerSecondaryHref: '/select-role',
      headerSecondaryLabel: 'Kom i gang',
      heroBuyerHref: '/select-role',
      heroBuyerLabel: 'Jeg vil kjøpe bil',
      heroDealerHref: '/select-role',
      heroDealerLabel: 'Jeg er forhandler',
      userRole: null,
    };
  }

  const profile = await ensureUserProfile({ id: user.id });
  const role = profile.role;

  if (role === 'dealer') {
    const dealerships = await getDealershipsForUser(profile.userId);
    const hasDealership = dealerships.length > 0;
    return {
      headerPrimaryHref: hasDealership ? '/dealer' : '/dealer/onboarding',
      headerPrimaryLabel: hasDealership ? 'Min forhandlerside' : 'Fullfør registrering',
      headerSecondaryHref: null,
      headerSecondaryLabel: null,
      heroBuyerHref: '/dealer',
      heroBuyerLabel: 'Min forhandlerside',
      heroDealerHref: hasDealership ? '/dealer' : '/dealer/onboarding',
      heroDealerLabel: hasDealership ? 'Gå til forhandlersiden' : 'Fullfør registrering',
      userRole: 'dealer',
    };
  }

  // buyer (or admin)
  return {
    headerPrimaryHref: '/buyer/requests',
    headerPrimaryLabel: 'Mine forespørsler',
    headerSecondaryHref: null,
    headerSecondaryLabel: null,
    heroBuyerHref: '/buyer/requests',
    heroBuyerLabel: 'Gå til mine forespørsler',
    heroDealerHref: '/buyer/requests',
    heroDealerLabel: 'Gå til mine forespørsler',
    userRole: role,
  };
}
