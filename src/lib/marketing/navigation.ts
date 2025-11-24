import { stackServerApp } from '@/stack/server';
import { ensureUserProfile } from '@/lib/services/userProfiles';
import { getDealershipsForUser } from '@/lib/services/dealerships';

export type MarketingNavigationState = {
  headerPrimaryHref: string;
  headerPrimaryLabel: string;
  headerSecondaryHref: string;
  headerSecondaryLabel: string;
  heroBuyerHref: string;
  heroBuyerLabel: string;
  heroDealerHref: string;
  heroDealerLabel: string;
};

export async function getMarketingNavigationState(): Promise<MarketingNavigationState> {
  const user = await stackServerApp.getUser();

  let hasDealership = false;

  if (user) {
    const profile = await ensureUserProfile({ id: user.id });
    const dealerships = await getDealershipsForUser(profile.userId);
    hasDealership = dealerships.length > 0;
  }

  const isLoggedIn = !!user;

  const headerPrimaryHref = isLoggedIn ? '/buyer/requests' : '/buyer';
  const headerPrimaryLabel = isLoggedIn ? 'Min kjøperside' : 'Kom i gang';

  const headerSecondaryHref = isLoggedIn
    ? hasDealership
      ? '/dealer/requests'
      : '/dealer/onboarding'
    : '/handler/sign-in';
  const headerSecondaryLabel = isLoggedIn
    ? hasDealership
      ? 'Min forhandlerside'
      : 'Registrer forhandler'
    : 'Logg inn';

  const heroBuyerHref = isLoggedIn ? '/buyer/requests' : '/buyer';
  const heroBuyerLabel = isLoggedIn
    ? 'Gå til mine forespørsler'
    : 'Jeg vil kjøpe bil';

  const heroDealerHref = isLoggedIn
    ? hasDealership
      ? '/dealer/requests'
      : '/dealer/onboarding'
    : '/dealer';
  const heroDealerLabel = isLoggedIn
    ? hasDealership
      ? 'Gå til forhandlersiden'
      : 'Registrer din forhandler'
    : 'Jeg er forhandler';

  return {
    headerPrimaryHref,
    headerPrimaryLabel,
    headerSecondaryHref,
    headerSecondaryLabel,
    heroBuyerHref,
    heroBuyerLabel,
    heroDealerHref,
    heroDealerLabel,
  };
}
