import { getMarketingNavigationState } from '@/lib/marketing/navigation';
import { Header } from '@/components/marketing/header';
import { HeroSection } from '@/components/marketing/hero-section';
import { TwoPathsSection } from '@/components/marketing/two-paths-section';
import { BuyerFlowSection } from '@/components/marketing/buyer-flow-section';
import { DealerFlowSection } from '@/components/marketing/dealer-flow-section';
import { TrustSection } from '@/components/marketing/trust-section';
import { Footer } from '@/components/marketing/footer';

export default async function HomePage() {
  const nav = await getMarketingNavigationState();
  const isLoggedIn = nav.userRole !== null;

  return (
    <div className='min-h-screen flex flex-col'>
      <Header primaryHref={nav.headerPrimaryHref} primaryLabel={nav.headerPrimaryLabel} secondaryHref={nav.headerSecondaryHref} secondaryLabel={nav.headerSecondaryLabel} />

      <main className='flex-1'>
        <HeroSection primaryHref={nav.headerPrimaryHref} primaryLabel={nav.headerPrimaryLabel} isLoggedIn={isLoggedIn} />

        {!isLoggedIn && <TwoPathsSection />}

        <BuyerFlowSection />
        <DealerFlowSection />

        <TrustSection />
      </main>

      <Footer />
    </div>
  );
}
