import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CarFront,
  Store,
  CheckCircle2,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Clock,
  Users,
  BarChart3,
  MapPin,
  Zap,
  Heart,
  Award,
  ArrowRight,
} from 'lucide-react';
import { getMarketingNavigationState } from '@/lib/marketing/navigation';

export default async function AboutPage() {
  const {
    headerPrimaryHref,
    headerPrimaryLabel,
    headerSecondaryHref,
    headerSecondaryLabel,
    heroBuyerHref,
    heroDealerHref,
  } = await getMarketingNavigationState();

  return (
    <div className='min-h-screen flex flex-col'>
      {/* Navigation */}
      <header className='sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto px-4 h-16 flex items-center justify-between'>
          <Link
            href='/'
            className='flex items-center gap-2 font-serif text-xl font-bold tracking-tight'
          >
            <div className='w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center'>
              <CarFront className='w-4 h-4' />
            </div>
            BilMarked
          </Link>
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
            <Button
              asChild
              variant='ghost'
              size='sm'
              className='hidden sm:flex'
            >
              <Link href={headerSecondaryHref}>{headerSecondaryLabel}</Link>
            </Button>
            <Button asChild size='sm'>
              <Link href={headerPrimaryHref}>{headerPrimaryLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='relative py-20 md:py-32 overflow-hidden bg-stone-50'>
          <div className='container mx-auto px-4 relative z-10'>
            <div className='max-w-4xl mx-auto text-center space-y-8'>
              <div className='inline-flex items-center rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground shadow-sm'>
                <span className='mr-2 flex h-2 w-2 rounded-full bg-emerald-500' />
                Om BilMarked
              </div>

              <h1 className='font-serif text-5xl md:text-7xl font-medium tracking-tight text-primary leading-[1.1]'>
                Vi moderniserer
                <br />
                <span className='text-emerald-600 italic'>
                  bilhandelen i Norge.
                </span>
              </h1>

              <p className='text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed'>
                BilMarked er en digital markedsplass som kobler kjøpere og
                forhandlere på en transparent, effektiv og trygg måte. Vår
                visjon er å gjøre bilkjøp til en positiv opplevelse for alle
                parter.
              </p>
            </div>
          </div>

          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-emerald-100/30 to-transparent rounded-full blur-3xl -z-10' />
        </section>

        {/* How It Works - Detailed */}
        <section className='py-24 bg-white'>
          <div className='container mx-auto px-4'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <h2 className='font-serif text-4xl md:text-5xl mb-6 text-balance'>
                Slik fungerer BilMarked
              </h2>
              <p className='text-lg text-muted-foreground leading-relaxed'>
                Vi har designet en prosess som sparer tid, penger og stress for
                både kjøpere og forhandlere.
              </p>
            </div>

            {/* For Buyers */}
            <div className='mb-20 flex flex-col mx-auto'>
              <div className='flex flex-col items-center mx-auto gap-3 mb-8'>
                <div className='w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center'>
                  <CarFront className='w-5 h-5 text-emerald-600' />
                </div>
                <h3 className='font-serif text-2xl md:text-3xl'>For kjøpere</h3>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4 max-w-6xl mx-auto'>
                {/* Step 1 - Large featured card */}
                <Card className='md:col-span-3 bg-gradient-to-br from-emerald-500 to-emerald-600 border-none shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative'>
                  <CardContent className='h-full min-h-[280px] flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-10 text-white relative z-10 gap-8'>
                    <div className='flex-1'>
                      <span className='font-serif text-8xl opacity-20 font-bold absolute top-4 right-8'>
                        01
                      </span>
                      <div className='w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6'>
                        <Search className='w-8 h-8' />
                      </div>
                      <h4 className='font-serif text-3xl md:text-4xl font-medium mb-4'>
                        Opprett forespørsel
                      </h4>
                      <p className='text-emerald-50 text-lg leading-relaxed max-w-2xl'>
                        Beskriv drømmebilen din med budsjett, preferanser og
                        eventuelt bilder. Spesifiser om du vil ha en spesifikk
                        modell eller et generelt søk.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2 */}
                <Card className='bg-stone-900 border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative'>
                  <CardContent className='h-full min-h-[300px] flex flex-col justify-between p-8 text-white relative z-10'>
                    <div>
                      <span className='font-serif text-7xl opacity-10 font-bold absolute top-4 right-8'>
                        02
                      </span>
                      <div className='w-16 h-16 bg-emerald-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6'>
                        <Zap className='w-8 h-8 text-emerald-400' />
                      </div>
                      <h4 className='font-serif text-2xl md:text-3xl font-medium mb-4'>
                        Motta tilbud
                      </h4>
                    </div>
                    <p className='text-stone-300 leading-relaxed'>
                      Verifiserte forhandlere matcher forespørselen din med
                      biler de har på lager og sender deg konkurransedyktige
                      tilbud.
                    </p>
                  </CardContent>
                </Card>

                {/* Step 3 */}
                <Card className='bg-white border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden'>
                  <div className='absolute inset-0 bg-gradient-to-br from-stone-50 to-transparent' />
                  <CardContent className='h-full min-h-[300px] flex flex-col justify-between p-8 relative z-10'>
                    <div>
                      <span className='font-serif text-7xl text-stone-100 font-bold absolute top-4 right-8'>
                        03
                      </span>
                      <div className='w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6'>
                        <BarChart3 className='w-8 h-8 text-emerald-600' />
                      </div>
                      <h4 className='font-serif text-2xl md:text-3xl font-medium mb-4'>
                        Sammenlign
                      </h4>
                    </div>
                    <p className='text-muted-foreground leading-relaxed'>
                      Få oversikt over alle tilbudene på ett sted. Se bilder,
                      spesifikasjoner, priser og velg den beste løsningen for
                      deg.
                    </p>
                  </CardContent>
                </Card>

                {/* Step 4 */}
                <Card className='bg-gradient-to-br from-emerald-500 to-emerald-600 border-none shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden'>
                  <div className='absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24' />
                  <CardContent className='h-full min-h-[300px] flex flex-col justify-between p-8 text-white relative z-10'>
                    <div>
                      <span className='font-serif text-7xl opacity-20 font-bold absolute top-4 right-8'>
                        04
                      </span>
                      <div className='w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6'>
                        <CheckCircle2 className='w-8 h-8' />
                      </div>
                      <h4 className='font-serif text-2xl md:text-3xl font-medium mb-4'>
                        Velg & kjøp
                      </h4>
                    </div>
                    <p className='text-emerald-50 leading-relaxed'>
                      Når du har funnet den rette bilen, tar du kontakt med
                      forhandleren direkte for å fullføre handelen trygt og
                      enkelt.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* For Dealers */}
            <div className='mx-auto'>
              <div className='flex flex-col items-center mx-auto gap-3 mb-8'>
                <div className='w-10 h-10 bg-stone-900 rounded-full flex items-center justify-center'>
                  <Store className='w-5 h-5 text-white' />
                </div>
                <h3 className='font-serif text-2xl md:text-3xl'>
                  For forhandlere
                </h3>
              </div>

              <div className='space-y-4 max-w-6xl mx-auto'>
                {/* Step 1 */}
                <Card className='bg-stone-900 border-none shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden'>
                  <CardContent className='flex flex-col md:flex-row items-start md:items-center gap-8 p-8 md:p-10 text-white'>
                    <div className='w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0'>
                      <Users className='w-10 h-10' />
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-4 mb-3'>
                        <span className='font-serif text-5xl opacity-30 font-bold'>
                          01
                        </span>
                        <h4 className='font-serif text-2xl md:text-3xl font-medium'>
                          Motta kvalifiserte leads
                        </h4>
                      </div>
                      <p className='text-stone-300 text-lg leading-relaxed'>
                        Få varsler om kjøpere som leter etter biler som matcher
                        lageret ditt. Ingen tidsspille på irrelevante
                        henvendelser.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 2 */}
                <Card className='bg-gradient-to-br from-emerald-500 to-emerald-600 border-none shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden'>
                  <div className='absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32' />
                  <CardContent className='flex flex-col md:flex-row-reverse items-start md:items-center gap-8 p-8 md:p-10 text-white relative z-10'>
                    <div className='w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0'>
                      <Sparkles className='w-10 h-10' />
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-4 mb-3'>
                        <span className='font-serif text-5xl opacity-30 font-bold'>
                          02
                        </span>
                        <h4 className='font-serif text-2xl md:text-3xl font-medium'>
                          Send skreddersydde tilbud
                        </h4>
                      </div>
                      <p className='text-emerald-50 text-lg leading-relaxed'>
                        Last opp bilder av bilen, beskriv tilstanden, inkluder
                        spesifikasjoner og send et konkurransedyktig tilbud
                        direkte til kjøperen.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 3 */}
                <Card className='bg-white border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden'>
                  <div className='absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent opacity-50' />
                  <CardContent className='flex flex-col md:flex-row items-start md:items-center gap-8 p-8 md:p-10 relative z-10'>
                    <div className='w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0'>
                      <TrendingUp className='w-10 h-10 text-emerald-600' />
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-4 mb-3'>
                        <span className='font-serif text-5xl text-stone-200 font-bold'>
                          03
                        </span>
                        <h4 className='font-serif text-2xl md:text-3xl font-medium'>
                          Følg opp i sanntid
                        </h4>
                      </div>
                      <p className='text-muted-foreground text-lg leading-relaxed'>
                        Se når kjøpere ser tilbudet ditt, sammenligner og viser
                        interesse. Hold oversikt over alle dine aktive tilbud i
                        ett dashboard.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Step 4 */}
                <Card className='bg-stone-900 border-none shadow-lg hover:shadow-xl transition-all duration-300'>
                  <CardContent className='flex flex-col md:flex-row-reverse items-start md:items-center gap-8 p-8 md:p-10 text-white'>
                    <div className='w-20 h-20 bg-emerald-500/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0'>
                      <ShieldCheck className='w-10 h-10 text-emerald-400' />
                    </div>
                    <div className='flex-1'>
                      <div className='flex items-center gap-4 mb-3'>
                        <span className='font-serif text-5xl opacity-30 font-bold'>
                          04
                        </span>
                        <h4 className='font-serif text-2xl md:text-3xl font-medium'>
                          Selg trygt
                        </h4>
                      </div>
                      <p className='text-stone-300 text-lg leading-relaxed'>
                        Når kjøper aksepterer, fullføres handelen med vår trygge
                        løsning som sikrer begge parter gjennom hele prosessen.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features & Benefits */}
        <section className='py-24 bg-stone-50'>
          <div className='container mx-auto px-4'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <h2 className='font-serif text-4xl md:text-5xl mb-6 text-balance'>
                Fordeler med BilMarked
              </h2>
              <p className='text-lg text-muted-foreground'>
                Vi har bygget en plattform som gir deg kontroll, transparens og
                trygghet.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto'>
              {/* Spar tid */}
              <Card className='md:col-span-2 bg-gradient-to-br from-emerald-500 to-emerald-600 border-none shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden relative'>
                <div className='absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-24 translate-y-24' />
                <CardContent className='h-full min-h-[300px] flex flex-col justify-between p-10 text-white relative z-10 gap-8'>
                  <div className='flex-1'>
                    <div className='w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6'>
                      <Clock className='w-8 h-8' />
                    </div>
                    <h3 className='font-serif text-3xl md:text-4xl font-medium mb-4'>
                      Spar tid
                    </h3>
                    <p className='text-emerald-50 text-lg leading-relaxed max-w-2xl'>
                      Ingen ringerunder til flere forhandlere. Send én
                      forespørsel og la tilbudene komme til deg.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Få beste pris */}
              <Card className='bg-stone-900 border-none shadow-lg hover:shadow-xl transition-all duration-300 group'>
                <CardContent className='h-full min-h-[300px] flex flex-col justify-between p-8 text-white'>
                  <div>
                    <div className='w-14 h-14 mb-6 bg-emerald-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                      <TrendingUp className='w-7 h-7 text-emerald-400' />
                    </div>
                    <h3 className='font-serif text-2xl font-medium mb-3'>
                      Få beste pris
                    </h3>
                    <p className='text-stone-300 leading-relaxed'>
                      Når forhandlere konkurrerer om din ordre, får du et bedre
                      tilbud.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Trygg handel */}
              <Card className='bg-white border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 group'>
                <CardContent className='h-full min-h-[280px] flex flex-col justify-between p-8'>
                  <div className='w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <ShieldCheck className='w-8 h-8 text-emerald-600' />
                  </div>
                  <div>
                    <h3 className='font-serif text-2xl font-medium mb-3'>
                      Trygg handel
                    </h3>
                    <p className='text-muted-foreground leading-relaxed'>
                      Alle forhandlere er verifiserte. Vi sikrer at
                      dokumentasjon og garanti er på plass.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Lokal eller nasjonal */}
              <Card className='bg-stone-50 border-stone-200 shadow-sm hover:shadow-md transition-all duration-300'>
                <CardContent className='h-full min-h-[280px] flex flex-col justify-between p-8'>
                  <div className='w-14 h-14  rounded-xl flex items-center justify-center shrink-0 shadow-sm'>
                    <MapPin className='w-7 h-7 text-stone-900' />
                  </div>
                  <div>
                    <h3 className='font-serif text-xl font-medium mb-3'>
                      Lokal eller nasjonal
                    </h3>
                    <p className='text-muted-foreground leading-relaxed'>
                      Søk etter biler i ditt område eller vis forespørselen til
                      hele Norge.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Personlige tilbud */}
              <Card className='bg-white border-stone-200 shadow-sm hover:shadow-md transition-all duration-300 group'>
                <CardContent className='h-full min-h-[280px] flex flex-col justify-between p-8'>
                  <div className='w-14 h-14 shadow-md rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                    <Sparkles className='w-7 h-7 text-stone-900' />
                  </div>
                  <div>
                    <h3 className='font-serif text-xl font-medium mb-3'>
                      Personlige tilbud
                    </h3>
                    <p className='text-muted-foreground leading-relaxed'>
                      Hvert tilbud er skreddersydd til dine ønsker. Ingen
                      generisk spam.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Kvalitetssikret */}
              <Card className='md:col-span-3 bg-stone-900 border-none shadow-lg hover:shadow-xl transition-all duration-300'>
                <CardContent className='h-full min-h-[200px] flex items-center gap-8 p-10 text-white'>
                  <div className='w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0'>
                    <Award className='w-8 h-8 text-emerald-400' />
                  </div>
                  <div>
                    <h3 className='font-serif text-2xl md:text-3xl font-medium mb-3'>
                      Kvalitetssikret
                    </h3>
                    <p className='text-stone-300 text-lg leading-relaxed'>
                      Vi verifiserer alle forhandlere og sikrer at biler
                      oppfyller Norges krav til bilsalg. Din trygghet er vår
                      prioritet.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className='py-24 bg-stone-900 text-stone-50'>
          <div className='container mx-auto px-4'>
            <div className='grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto'>
              <div className='space-y-8'>
                <div className='inline-flex items-center rounded-full border border-stone-700 bg-stone-800 px-4 py-1.5 text-sm text-stone-300'>
                  <ShieldCheck className='w-4 h-4 mr-2 text-emerald-500' />
                  Trygghet først
                </div>

                <h2 className='font-serif text-4xl md:text-5xl leading-tight'>
                  Din sikkerhet er vår{' '}
                  <span className='italic text-emerald-400'>prioritet.</span>
                </h2>

                <p className='text-stone-400 text-lg leading-relaxed'>
                  Vi forstår at å kjøpe bil er en stor beslutning. Derfor har vi
                  bygget inn sikkerhetstiltak i hver del av prosessen for å
                  beskytte både kjøpere og forhandlere.
                </p>

                <div className='space-y-6 pt-4'>
                  {[
                    {
                      icon: ShieldCheck,
                      title: 'Verifiserte forhandlere',
                      desc: 'Alle forhandlere gjennomgår en grundig verifikasjonsprosess før de får tilgang til plattformen.',
                    },
                    {
                      icon: CheckCircle2,
                      title: 'Tilstandsrapport påkrevd',
                      desc: 'Hver bil må ha en oppdatert tilstandsrapport slik at du vet nøyaktig hva du kjøper.',
                    },
                    {
                      icon: Award,
                      title: 'Garanti inkludert',
                      desc: 'Alle biler solgt gjennom BilMarked leveres med garanti for din trygghet.',
                    },
                    {
                      icon: Heart,
                      title: 'Støtte hele veien',
                      desc: 'Vårt team er tilgjengelig for å hjelpe deg gjennom hele kjøps- eller salgsprosessen.',
                    },
                  ].map((item, i) => (
                    <div key={i} className='flex gap-4'>
                      <div className='w-12 h-12 bg-stone-800 rounded-xl flex items-center justify-center shrink-0'>
                        <item.icon className='w-6 h-6 text-emerald-500' />
                      </div>
                      <div>
                        <h4 className='font-medium mb-1'>{item.title}</h4>
                        <p className='text-sm text-stone-400 leading-relaxed'>
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='relative h-[600px] rounded-2xl overflow-hidden'>
                <Image
                  src='/images/handshake-car-keys-luxury-dark.jpg'
                  alt='Trygg bilhandel'
                  fill
                  sizes='(min-width: 1024px) 600px, 100vw'
                  className='object-cover'
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-24 bg-white'>
          <div className='container mx-auto px-4'>
            <div className='max-w-4xl mx-auto text-center space-y-8'>
              <h2 className='font-serif text-4xl md:text-6xl font-medium tracking-tight'>
                Klar til å komme i gang?
              </h2>
              <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
                Bli med tusenvis av fornøyde nordmenn som har funnet sin neste
                bil på BilMarked.
              </p>
              <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-4'>
                <Button
                  asChild
                  size='lg'
                  className='h-12 px-8 text-base rounded-full'
                >
                  <Link href={heroBuyerHref}>
                    Start bilsøket
                    <ArrowRight className='ml-2 w-4 h-4' />
                  </Link>
                </Button>
                <Button
                  asChild
                  variant='outline'
                  size='lg'
                  className='h-12 px-8 text-base rounded-full bg-transparent'
                >
                  <Link href={heroDealerHref}>Bli forhandlerpartner</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className='bg-stone-50 border-t py-12'>
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
                  <Link href='/buyer' className='hover:text-primary'>
                    Kjøp bil
                  </Link>
                </li>
                <li>
                  <Link href='/dealer' className='hover:text-primary'>
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
                  <Link href='/about' className='hover:text-primary'>
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
                    Kontakt
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className='font-medium mb-4'>Support</h4>
              <ul className='space-y-2 text-sm text-muted-foreground'>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Hjelp
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Personvern
                  </Link>
                </li>
                <li>
                  <Link href='#' className='hover:text-primary'>
                    Vilkår
                  </Link>
                </li>
              </ul>
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
