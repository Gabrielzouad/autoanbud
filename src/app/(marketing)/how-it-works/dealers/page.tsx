import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CarFront,
  Store,
  ArrowRight,
  Send,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Bell,
  Settings,
  Zap,
  Target,
  Clock,
  CreditCard,
  FileText,
  MessageSquare,
} from 'lucide-react';
import { getMarketingNavigationState } from '@/lib/marketing/navigation';

export default async function DealersHowItWorksPage() {
  const nav = await getMarketingNavigationState();
  const isLoggedIn = nav.userRole !== null;
  const ctaHref = isLoggedIn ? nav.headerPrimaryHref : '/select-role';
  const ctaLabel = isLoggedIn ? nav.headerPrimaryLabel : 'Registrer som forhandler';

  return (
    <div className='min-h-screen flex flex-col'>
      <header className='sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto px-4 h-16 flex items-center justify-between'>
          <Link href='/' className='flex items-center gap-2 font-serif text-xl font-bold tracking-tight'>
            <div className='w-8 h-8 bg-emerald-900 text-white rounded-full flex items-center justify-center'>
              <CarFront className='w-4 h-4' />
            </div>
            AutoAnbud
          </Link>
          <nav className='hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground'>
            <Link href='/how-it-works/buyers' className='hover:text-primary transition-colors'>
              For kjøpere
            </Link>
            <Link href='/how-it-works/dealers' className='text-emerald-700 font-semibold transition-colors'>
              For forhandlere
            </Link>
            <Link href='/about' className='hover:text-primary transition-colors'>
              Om oss
            </Link>
          </nav>
          <div className='flex items-center gap-3'>
            {!isLoggedIn && (
              <Button asChild variant='ghost' size='sm' className='hidden sm:flex'>
                <Link href='/handler/sign-in'>Logg inn</Link>
              </Button>
            )}
            <Button asChild size='sm' className='bg-emerald-900 hover:bg-emerald-800'>
              <Link href={nav.headerPrimaryHref}>{nav.headerPrimaryLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className='flex-1'>
        {/* Hero */}
        <section className='relative py-20 md:py-32 overflow-hidden bg-stone-900 text-white'>
          <div className='container mx-auto px-4 relative z-10'>
            <div className='max-w-4xl mx-auto text-center space-y-8'>
              <div className='inline-flex items-center rounded-full border border-stone-700 bg-stone-800 px-4 py-1.5 text-sm text-stone-300'>
                <Store className='w-4 h-4 mr-2 text-emerald-400' />
                Slik fungerer det for forhandlere
              </div>

              <h1 className='font-serif text-5xl md:text-7xl font-medium tracking-tight leading-[1.1] text-balance'>
                Selg mer, <br />
                <span className='text-emerald-400 italic'>jobb smartere.</span>
              </h1>

              <p className='text-lg md:text-xl text-stone-400 max-w-2xl mx-auto leading-relaxed'>
                Få tilgang til kvalifiserte kjøpere som aktivt leter etter bil. Ingen kalde leads — bare
                seriøse henvendelser som matcher lageret ditt.
              </p>

              <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-4'>
                <Button asChild size='lg' className='h-12 px-8 text-base rounded-full bg-emerald-700 hover:bg-emerald-600'>
                  <Link href={ctaHref}>
                    {ctaLabel} <ArrowRight className='ml-2 w-4 h-4' />
                  </Link>
                </Button>
                <Button asChild variant='outline' size='lg' className='h-12 px-8 text-base rounded-full border-stone-700 bg-stone-800 text-white hover:bg-stone-700'>
                  <Link href='/how-it-works/buyers'>Er du kjøper?</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-emerald-900/20 to-transparent rounded-full blur-3xl -z-10' />
        </section>

        {/* Onboarding steps */}
        <section className='py-24 bg-white'>
          <div className='container mx-auto px-4'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <h2 className='font-serif text-4xl md:text-5xl mb-6 text-balance'>Kom i gang på 15 minutter</h2>
              <p className='text-lg text-muted-foreground leading-relaxed'>
                Enkel oppsett, rask verifisering og du er klar til å motta forespørsler.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-20'>
              <Card className='bg-stone-50 border-stone-200 shadow-sm relative overflow-hidden'>
                <CardContent className='p-8 space-y-4'>
                  <span className='font-serif text-6xl text-stone-200 font-bold absolute top-2 right-4'>1</span>
                  <div className='w-14 h-14 bg-stone-900 rounded-2xl flex items-center justify-center'>
                    <FileText className='w-7 h-7 text-white' />
                  </div>
                  <h3 className='font-serif text-xl font-medium'>Registrer deg</h3>
                  <p className='text-muted-foreground leading-relaxed'>
                    Opprett konto med organisasjonsnummer og grunnleggende bedriftsinformasjon.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-stone-900 border-none shadow-lg text-white relative overflow-hidden'>
                <CardContent className='p-8 space-y-4'>
                  <span className='font-serif text-6xl text-stone-800 font-bold absolute top-2 right-4'>2</span>
                  <div className='w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center'>
                    <Settings className='w-7 h-7 text-emerald-400' />
                  </div>
                  <h3 className='font-serif text-xl font-medium'>Sett opp preferanser</h3>
                  <p className='text-stone-400 leading-relaxed'>
                    Velg hvilke merker og biltyper du håndterer, prisklasser og geografisk dekningsområde.
                  </p>
                </CardContent>
              </Card>

              <Card className='bg-emerald-700 border-none shadow-lg text-white relative overflow-hidden'>
                <CardContent className='p-8 space-y-4'>
                  <span className='font-serif text-6xl text-emerald-600 font-bold absolute top-2 right-4'>3</span>
                  <div className='w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center'>
                    <Zap className='w-7 h-7 text-white' />
                  </div>
                  <h3 className='font-serif text-xl font-medium'>Start å selge</h3>
                  <p className='text-emerald-100 leading-relaxed'>
                    Motta varsler om forespørsler som matcher ditt lager og send tilbud direkte.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Daily flow */}
        <section className='py-24 bg-stone-50'>
          <div className='container mx-auto px-4'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <h2 className='font-serif text-4xl md:text-5xl mb-6 text-balance'>Slik fungerer hverdagen</h2>
              <p className='text-lg text-muted-foreground leading-relaxed'>
                En strømlinjeformet prosess fra forespørsel til salg.
              </p>
            </div>

            <div className='space-y-6 max-w-5xl mx-auto'>
              <Card className='bg-white border-stone-200 shadow-sm overflow-hidden'>
                <CardContent className='flex flex-col md:flex-row items-start md:items-center gap-8 p-8 md:p-10'>
                  <div className='w-20 h-20 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0'>
                    <Bell className='w-10 h-10 text-emerald-700' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-4 mb-3'>
                      <span className='font-serif text-4xl text-stone-300 font-bold'>01</span>
                      <h3 className='font-serif text-2xl md:text-3xl font-medium'>Motta kvalifiserte forespørsler</h3>
                    </div>
                    <p className='text-muted-foreground text-lg leading-relaxed'>
                      Basert på dine preferanser får du kun forespørsler som matcher biler du faktisk har eller kan skaffe.
                    </p>
                    <ul className='mt-4 flex flex-wrap gap-3'>
                      {['Push-varsler', 'E-postvarsler', 'Dashboard-oversikt'].map((t) => (
                        <li key={t} className='inline-flex items-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full'>
                          <CheckCircle2 className='w-3.5 h-3.5' /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-stone-900 border-none shadow-lg overflow-hidden'>
                <CardContent className='flex flex-col md:flex-row-reverse items-start md:items-center gap-8 p-8 md:p-10 text-white'>
                  <div className='w-20 h-20 bg-emerald-500/20 rounded-2xl flex items-center justify-center shrink-0'>
                    <Send className='w-10 h-10 text-emerald-400' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-4 mb-3'>
                      <span className='font-serif text-4xl text-stone-700 font-bold'>02</span>
                      <h3 className='font-serif text-2xl md:text-3xl font-medium'>Send skreddersydde tilbud</h3>
                    </div>
                    <p className='text-stone-300 text-lg leading-relaxed'>
                      Last opp bilder, beskriv tilstand og utstyr, sett pris og send tilbudet direkte til kjøperen.
                    </p>
                    <ul className='mt-4 flex flex-wrap gap-3'>
                      {['Bildeopplasting', 'Prisforslag', 'Spesifikasjoner'].map((t) => (
                        <li key={t} className='inline-flex items-center gap-1.5 text-sm text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full'>
                          <CheckCircle2 className='w-3.5 h-3.5' /> {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-white border-stone-200 shadow-sm overflow-hidden'>
                <CardContent className='flex flex-col md:flex-row items-start md:items-center gap-8 p-8 md:p-10'>
                  <div className='w-20 h-20 bg-stone-100 rounded-2xl flex items-center justify-center shrink-0'>
                    <BarChart3 className='w-10 h-10 text-stone-700' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-4 mb-3'>
                      <span className='font-serif text-4xl text-stone-300 font-bold'>03</span>
                      <h3 className='font-serif text-2xl md:text-3xl font-medium'>Følg opp i sanntid</h3>
                    </div>
                    <p className='text-muted-foreground text-lg leading-relaxed'>
                      Se status på alle tilbud fra dashbordet. Svar på spørsmål via chatten og hold dialogen i gang.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className='bg-gradient-to-br from-emerald-700 to-emerald-800 border-none shadow-lg overflow-hidden'>
                <CardContent className='flex flex-col md:flex-row-reverse items-start md:items-center gap-8 p-8 md:p-10 text-white'>
                  <div className='w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center shrink-0'>
                    <MessageSquare className='w-10 h-10 text-white' />
                  </div>
                  <div className='flex-1'>
                    <div className='flex items-center gap-4 mb-3'>
                      <span className='font-serif text-4xl text-emerald-500/50 font-bold'>04</span>
                      <h3 className='font-serif text-2xl md:text-3xl font-medium'>Lukk salget</h3>
                    </div>
                    <p className='text-emerald-50 text-lg leading-relaxed'>
                      Kjøper aksepterer tilbudet direkte i plattformen. Avtal levering og fullfør salget.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className='py-24 bg-white'>
          <div className='container mx-auto px-4'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <h2 className='font-serif text-4xl md:text-5xl mb-6 text-balance'>Fordeler for din bedrift</h2>
              <p className='text-lg text-muted-foreground'>
                AutoAnbud gir deg verktøyene du trenger for å selge mer effektivt.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto'>
              {[
                { icon: Target, title: 'Kvalifiserte leads', desc: 'Kun seriøse kjøpere som aktivt leter etter bil. Ingen tidsspille på kalde henvendelser.' },
                { icon: Clock, title: 'Spar tid', desc: 'Effektiv prosess fra forespørsel til salg. Mindre administrasjon, mer salg.' },
                { icon: TrendingUp, title: 'Øk omsetningen', desc: 'Nå kunder du ellers ikke ville nådd uten ekstra markedsføringskostnader.' },
                { icon: BarChart3, title: 'Innsikt og analyse', desc: 'Forstå markedet bedre med data om etterspørsel, priser og konkurranse.' },
                { icon: ShieldCheck, title: 'Trygg plattform', desc: 'Verifiserte kjøpere og sikre transaksjoner. Bygg tillit med kundene dine.' },
                { icon: CreditCard, title: 'Fleksibel prising', desc: 'Betal kun for resultater. Ingen faste avgifter eller bindingstid.' },
              ].map((b) => (
                <Card key={b.title} className='bg-stone-50 border-stone-200 shadow-sm hover:shadow-md transition-all duration-300'>
                  <CardContent className='p-8 space-y-4'>
                    <div className='w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center'>
                      <b.icon className='w-7 h-7 text-emerald-700' />
                    </div>
                    <h3 className='font-serif text-xl font-medium'>{b.title}</h3>
                    <p className='text-muted-foreground leading-relaxed'>{b.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className='py-24 bg-stone-900 text-white'>
          <div className='container mx-auto px-4 text-center'>
            <div className='max-w-3xl mx-auto space-y-8'>
              <h2 className='font-serif text-4xl md:text-5xl leading-tight text-balance'>
                Klar til å øke salget?
              </h2>
              <p className='text-stone-400 text-lg leading-relaxed'>
                Bli med forhandlere som allerede bruker AutoAnbud for å nå flere kjøpere.
              </p>
              <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
                <Button asChild size='lg' className='h-14 px-10 text-lg rounded-full bg-emerald-700 hover:bg-emerald-600'>
                  <Link href={ctaHref}>
                    {ctaLabel} <ArrowRight className='ml-2 w-5 h-5' />
                  </Link>
                </Button>
                <Button asChild variant='outline' size='lg' className='h-14 px-10 text-lg rounded-full border-stone-700 bg-stone-800 text-white hover:bg-stone-700'>
                  <Link href='/about'>Les mer om AutoAnbud</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className='bg-white border-t py-12'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground'>
            <Link href='/' className='flex items-center gap-2 font-serif text-lg font-bold text-foreground'>
              <div className='w-7 h-7 bg-stone-900 text-white rounded-full flex items-center justify-center'>
                <CarFront className='w-3.5 h-3.5' />
              </div>
              AutoAnbud
            </Link>
            <div className='flex gap-6'>
              <Link href='/how-it-works/buyers' className='hover:text-primary'>For kjøpere</Link>
              <Link href='/how-it-works/dealers' className='hover:text-primary'>For forhandlere</Link>
              <Link href='/about' className='hover:text-primary'>Om oss</Link>
            </div>
            <p>© {new Date().getFullYear()} AutoAnbud AS</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
