import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  CarFront,
  Store,
  CheckCircle2,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { getMarketingNavigationState } from '@/lib/marketing/navigation';

export default async function HomePage() {
  const {
    headerPrimaryHref,
    headerPrimaryLabel,
    headerSecondaryHref,
    headerSecondaryLabel,
    heroBuyerHref,
    heroBuyerLabel,
    heroDealerHref,
    heroDealerLabel,
  } = await getMarketingNavigationState();

  return (
    <div className='min-h-screen flex flex-col'>
      {/* Navigation */}
      <header className='sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-backdrop-filter:bg-background/60'>
        <div className='container mx-auto px-4 h-16 flex items-center justify-between'>
          <div className='flex items-center gap-2 font-serif text-xl font-bold tracking-tight'>
            <div className='w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center'>
              <CarFront className='w-4 h-4' />
            </div>
            BilMarked
          </div>
          <nav className='hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground'>
            <Link
              href='/buyer'
              className='hover:text-primary transition-colors'
            >
              Kjøp bil
            </Link>
            <Link
              href='/dealer'
              className='hover:text-primary transition-colors'
            >
              For forhandlere
            </Link>
            <Link
              href='/about'
              className='hover:text-primary transition-colors'
            >
              Om oss
            </Link>
          </nav>
          <div className='flex items-center gap-4'>
            {/* Secondary: Logg inn / Min forhandlerside / Registrer forhandler */}
            <Button
              asChild
              variant='ghost'
              size='sm'
              className='hidden sm:flex'
            >
              <Link href={headerSecondaryHref}>{headerSecondaryLabel}</Link>
            </Button>

            {/* Primary: Kom i gang / Min kjøperside */}
            <Button asChild size='sm'>
              <Link href={headerPrimaryHref}>{headerPrimaryLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='relative py-20 md:py-32 overflow-hidden'>
          <div className='container mx-auto px-4 relative z-10'>
            <div className='max-w-3xl mx-auto text-center space-y-8'>
              <div className='inline-flex items-center rounded-full border bg-white/50 px-3 py-1 text-sm text-muted-foreground backdrop-blur-sm'>
                <span className='mr-2 flex h-2 w-2 rounded-full bg-emerald-500' />
                Fremtidens bilhandel er her
              </div>

              <h1 className='font-serif text-5xl md:text-7xl font-medium tracking-tight text-primary leading-[1.1]'>
                Finn din drømmebil <br />
                <span className='text-muted-foreground italic'>
                  uten stress.
                </span>
              </h1>

              <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
                Vi kobler seriøse kjøpere med Norges beste forhandlere. Ingen
                ringerunder, bare konkrete tilbud rett i innboksen.
              </p>

              <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-4'>
                <Button
                  asChild
                  size='lg'
                  className='h-12 px-8 text-base rounded-full'
                >
                  <Link href={heroBuyerHref}>
                    {heroBuyerLabel}
                    <ArrowRight className='ml-2 w-4 h-4' />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  size='lg'
                  className='h-12 px-8 text-base rounded-full bg-white/50 backdrop-blur-sm'
                >
                  <Link href={heroDealerHref}>{heroDealerLabel}</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Abstract Background Elements */}
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-linear-to-b from-stone-200/50 to-transparent rounded-full blur-3xl -z-10 opacity-50' />
        </section>

        {/* Visual Split Section */}
        <section className='py-20 bg-white'>
          <div className='container mx-auto px-4'>
            <div className='grid md:grid-cols-2 gap-8 lg:gap-12'>
              {/* Buyer Card */}
              <div className='group relative overflow-hidden rounded-3xl bg-stone-100 aspect-4/5 md:aspect-square lg:aspect-4/3'>
                <Image
                  src='/images/luxury-car-interior-minimalist.jpg'
                  alt='Kjøpe bil'
                  fill
                  className='object-cover transition-transform duration-700 group-hover:scale-105'
                />
                <div className='absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent p-8 flex flex-col justify-end text-white'>
                  <div className='transform transition-all duration-500 translate-y-4 group-hover:translate-y-0'>
                    <div className='flex items-center gap-2 mb-3 text-emerald-400 font-medium'>
                      <CarFront className='w-5 h-5' />
                      For kjøpere
                    </div>
                    <h3 className='font-serif text-3xl md:text-4xl mb-3'>
                      Enklere bilkjøp
                    </h3>
                    <p className='text-stone-200 mb-6 max-w-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100'>
                      Beskriv hva du leter etter, og la forhandlerne komme til
                      deg med sine beste tilbud.
                    </p>
                    <Button
                      asChild
                      variant='secondary'
                      className='rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200'
                    >
                      <Link href={heroBuyerHref}>Start søket nå</Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Dealer Card */}
              <div className='group relative overflow-hidden rounded-3xl bg-stone-900 aspect-4/5 md:aspect-square lg:aspect-4/3'>
                <Image
                  src='/images/modern-car-dealership-showroom-architecture.jpg'
                  alt='For forhandlere'
                  fill
                  className='object-cover transition-transform duration-700 group-hover:scale-105 opacity-80'
                />
                <div className='absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent p-8 flex flex-col justify-end text-white'>
                  <div className='transform transition-all duration-500 translate-y-4 group-hover:translate-y-0'>
                    <div className='flex items-center gap-2 mb-3 text-emerald-400 font-medium'>
                      <Store className='w-5 h-5' />
                      For forhandlere
                    </div>
                    <h3 className='font-serif text-3xl md:text-4xl mb-3'>
                      Smartere salg
                    </h3>
                    <p className='text-stone-200 mb-6 max-w-md opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100'>
                      Få tilgang til kjøpere som aktivt leter etter bil. Send
                      tilbud direkte fra lageret ditt.
                    </p>
                    <Button
                      asChild
                      variant='secondary'
                      className='rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-200'
                    >
                      <Link href={heroDealerHref}>Bli partner</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features / How it works */}
        <section className='py-24 bg-stone-50'>
          <div className='container mx-auto px-4'>
            <div className='text-center max-w-2xl mx-auto mb-16'>
              <h2 className='font-serif text-3xl md:text-4xl mb-4'>
                Slik fungerer det
              </h2>
              <p className='text-muted-foreground'>
                Vi har fjernet støyen fra bilhandelen. Tre enkle steg til din
                neste bil.
              </p>
            </div>

            <div className='grid md:grid-cols-3 gap-8'>
              {[
                {
                  icon: Search,
                  title: '1. Beskriv behovet',
                  desc: 'Fortell oss hvilken bil du er ute etter, budsjett og preferanser.',
                },
                {
                  icon: Sparkles,
                  title: '2. Motta tilbud',
                  desc: 'Forhandlere matcher dine ønsker med biler de har på lager.',
                },
                {
                  icon: ShieldCheck,
                  title: '3. Velg det beste',
                  desc: 'Sammenlign tilbudene i uten stress, og velg det som passer deg.',
                },
              ].map((step, i) => (
                <Card
                  key={i}
                  className='bg-white border-none shadow-sm hover:shadow-md transition-shadow duration-300'
                >
                  <CardContent className='pt-6 p-8 text-center space-y-4'>
                    <div className='w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto text-stone-900 mb-6'>
                      <step.icon className='w-6 h-6' />
                    </div>
                    <h3 className='font-serif text-xl font-medium'>
                      {step.title}
                    </h3>
                    <p className='text-muted-foreground leading-relaxed'>
                      {step.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className='py-24 bg-stone-900 text-stone-50'>
          <div className='container mx-auto px-4'>
            <div className='grid md:grid-cols-2 gap-12 items-center'>
              <div className='space-y-8'>
                <h2 className='font-serif text-3xl md:text-5xl leading-tight'>
                  Trygghet i hver handel.
                </h2>
                <p className='text-stone-400 text-lg leading-relaxed max-w-md'>
                  Vi samarbeider kun med verifiserte forhandlere for å sikre at
                  du gjør en trygg handel. Alle biler leveres med garanti og
                  tilstandsrapport.
                </p>
                <ul className='space-y-4'>
                  {[
                    'Verifiserte forhandlere',
                    'Tilstandsrapport på alle biler',
                    'Trygg betalingsløsning',
                    'Garanti inkludert',
                  ].map((item, i) => (
                    <li
                      key={i}
                      className='flex items-center gap-3 text-stone-300'
                    >
                      <CheckCircle2 className='w-5 h-5 text-emerald-500' />
                      {item}
                    </li>
                  ))}
                </ul>
                <Button
                  size='lg'
                  className='bg-white text-stone-900 hover:bg-stone-200 rounded-full px-8'
                >
                  Les mer om trygghet
                </Button>
              </div>
              <div className='relative h-[500px] rounded-2xl overflow-hidden'>
                <Image
                  src='/images/handshake-car-keys-luxury-dark.jpg'
                  alt='Trygg bilhandel'
                  fill
                  className='object-cover'
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer unchanged */}
      <footer className='bg-white border-t py-12'>
        <div className='container mx-auto px-4'>
          <div className='grid md:grid-cols-4 gap-8 mb-12'>
            <div className='space-y-4'>
              <div className='flex items-center gap-2 font-serif text-xl font-bold'>
                <div className='w-8 h-8 bg-stone-900 text-white rounded-full flex items-center justify-center'>
                  <CarFront className='w-4 h-4' />
                </div>
                BilMarked
              </div>
              <p className='text-sm text-muted-foreground'>
                Den enkleste måten å kjøpe og selge bil på i Norge.
              </p>
            </div>

            <div>
              <h4 className='font-medium mb-4'>Tjenester</h4>
              <ul className='space-y-2 text-sm text-muted-foreground'>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Kjøp bil
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Selg bil
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Verdivurdering
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Finansiering
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className='font-medium mb-4'>Selskap</h4>
              <ul className='space-y-2 text-sm text-muted-foreground'>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Om oss
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Karriere
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Presse
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Kontakt
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className='font-medium mb-4'>Hold deg oppdatert</h4>
              <p className='text-sm text-muted-foreground mb-4'>
                Motta nyheter og gode tilbud.
              </p>
              <div className='flex gap-2'>
                <input
                  type='email'
                  placeholder='Din e-post'
                  className='flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                />
                <Button size='sm'>Meld på</Button>
              </div>
            </div>
          </div>

          <div className='border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground'>
            <p>© 2025 BilMarked AS. Alle rettigheter reservert.</p>
            <div className='flex gap-6'>
              <Link href='#' className='hover:text-primary'>
                Personvern
              </Link>
              <Link href='#' className='hover:text-primary'>
                Vilkår
              </Link>
              <Link href='#' className='hover:text-primary'>
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
