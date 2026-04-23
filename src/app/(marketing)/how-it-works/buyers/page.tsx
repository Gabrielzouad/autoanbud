import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  CarFront,
  ArrowRight,
  Search,
  Bell,
  BarChart3,
  CheckCircle2,
  ShieldCheck,
  Clock,
  TrendingUp,
  MessageSquare,
  FileText,
  Sparkles,
  Heart,
} from 'lucide-react';
import { getMarketingNavigationState } from '@/lib/marketing/navigation';

export default async function BuyersHowItWorksPage() {
  const nav = await getMarketingNavigationState();
  const isLoggedIn = nav.userRole !== null;
  const ctaHref = isLoggedIn ? '/buyer/requests/new' : '/select-role';
  const ctaLabel = isLoggedIn ? 'Opprett forespørsel' : 'Kom i gang gratis';

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
            <Link href='/how-it-works/buyers' className='text-emerald-700 font-semibold transition-colors'>
              For kjøpere
            </Link>
            <Link href='/how-it-works/dealers' className='hover:text-primary transition-colors'>
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
        <section className='relative py-20 md:py-32 overflow-hidden bg-gradient-to-b from-emerald-50 to-background'>
          <div className='container mx-auto px-4 relative z-10'>
            <div className='max-w-4xl mx-auto text-center space-y-8'>
              <div className='inline-flex items-center rounded-full border bg-white px-4 py-1.5 text-sm text-muted-foreground shadow-sm'>
                <CarFront className='w-4 h-4 mr-2 text-emerald-600' />
                Slik fungerer det for kjøpere
              </div>

              <h1 className='font-serif text-5xl md:text-7xl font-medium tracking-tight leading-[1.1] text-balance'>
                La forhandlerne <br />
                <span className='text-emerald-700 italic'>komme til deg.</span>
              </h1>

              <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed'>
                Slutt med timevis av ringing og research. Beskriv drømmebilen din og motta
                konkrete tilbud fra seriøse forhandlere.
              </p>

              <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-4'>
                <Button asChild size='lg' className='h-12 px-8 text-base rounded-full bg-emerald-900 hover:bg-emerald-800'>
                  <Link href={ctaHref}>
                    {ctaLabel} <ArrowRight className='ml-2 w-4 h-4' />
                  </Link>
                </Button>
                <Button asChild variant='outline' size='lg' className='h-12 px-8 text-base rounded-full bg-white'>
                  <Link href='/how-it-works/dealers'>Er du forhandler?</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-gradient-to-b from-emerald-100/50 to-transparent rounded-full blur-3xl -z-10' />
        </section>

        {/* Steps */}
        <section className='py-24 bg-white'>
          <div className='container mx-auto px-4'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <h2 className='font-serif text-4xl md:text-5xl mb-6 text-balance'>
                Fire enkle steg til din neste bil
              </h2>
              <p className='text-lg text-muted-foreground leading-relaxed'>
                Vi har fjernet alt det kompliserte. Fra forespørsel til bilnøkler på under en uke.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto'>
              {/* Step 1 */}
              <Card className='md:col-span-2 bg-gradient-to-br from-emerald-700 to-emerald-800 border-none shadow-lg overflow-hidden relative'>
                <CardContent className='min-h-[320px] flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-12 text-white relative z-10 gap-8'>
                  <div className='flex-1'>
                    <span className='font-serif text-9xl opacity-10 font-bold absolute top-0 right-8'>1</span>
                    <div className='w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6'>
                      <Search className='w-8 h-8' />
                    </div>
                    <h3 className='font-serif text-3xl md:text-4xl font-medium mb-4'>Beskriv drømmebilen</h3>
                    <p className='text-emerald-50 text-lg leading-relaxed max-w-xl'>
                      Fortell oss hva du leter etter. Merke, modell, årsmodell, budsjett og eventuelle must-haves.
                      Jo mer detaljert, jo bedre tilbud får du.
                    </p>
                    <ul className='mt-6 space-y-2 text-emerald-100'>
                      <li className='flex items-center gap-2'><CheckCircle2 className='w-4 h-4' /> Velg blant populære merker og modeller</li>
                      <li className='flex items-center gap-2'><CheckCircle2 className='w-4 h-4' /> Sett ditt budsjett og preferanser</li>
                      <li className='flex items-center gap-2'><CheckCircle2 className='w-4 h-4' /> Last opp bilder av ønsket bil</li>
                    </ul>
                  </div>
                  <div className='w-32 h-32 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shrink-0'>
                    <FileText className='w-16 h-16 opacity-80' />
                  </div>
                </CardContent>
              </Card>

              {/* Step 2 */}
              <Card className='bg-stone-900 border-none shadow-lg overflow-hidden relative'>
                <CardContent className='min-h-[340px] flex flex-col justify-between p-8 text-white relative z-10'>
                  <div>
                    <span className='font-serif text-8xl opacity-5 font-bold absolute top-0 right-4'>2</span>
                    <div className='w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6'>
                      <Bell className='w-8 h-8 text-emerald-400' />
                    </div>
                    <h3 className='font-serif text-2xl md:text-3xl font-medium mb-4'>Motta varsler</h3>
                  </div>
                  <div>
                    <p className='text-stone-300 leading-relaxed mb-4'>
                      Forhandlere som har matchende biler på lager ser forespørselen din og sender tilbud.
                      Du får varsel når nye tilbud kommer inn.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-400 text-sm'>
                      <Sparkles className='w-4 h-4' />
                      Gjennomsnittlig 3–5 tilbud per forespørsel
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 3 */}
              <Card className='bg-white border-stone-200 shadow-sm overflow-hidden relative'>
                <div className='absolute inset-0 bg-gradient-to-br from-emerald-50 to-transparent' />
                <CardContent className='min-h-[340px] flex flex-col justify-between p-8 relative z-10'>
                  <div>
                    <span className='font-serif text-8xl text-stone-100 font-bold absolute top-0 right-4'>3</span>
                    <div className='w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6'>
                      <BarChart3 className='w-8 h-8 text-emerald-700' />
                    </div>
                    <h3 className='font-serif text-2xl md:text-3xl font-medium mb-4'>Sammenlign tilbud</h3>
                  </div>
                  <div>
                    <p className='text-muted-foreground leading-relaxed mb-4'>
                      Se alle tilbudene side om side. Bilder, spesifikasjoner, pris og forhandlerinformasjon — alt på ett sted.
                    </p>
                    <div className='flex items-center gap-2 text-emerald-700 text-sm'>
                      <Heart className='w-4 h-4' />
                      Still spørsmål direkte i chatten
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Step 4 */}
              <Card className='md:col-span-2 bg-stone-50 border-stone-200 shadow-sm overflow-hidden relative'>
                <CardContent className='min-h-[280px] flex flex-col md:flex-row items-start md:items-center justify-between p-8 md:p-12 relative z-10 gap-8'>
                  <div className='flex-1'>
                    <span className='font-serif text-9xl text-stone-200 font-bold absolute top-0 right-8'>4</span>
                    <div className='w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6'>
                      <MessageSquare className='w-8 h-8 text-emerald-700' />
                    </div>
                    <h3 className='font-serif text-3xl md:text-4xl font-medium mb-4'>Ta kontakt og kjøp</h3>
                    <p className='text-muted-foreground text-lg leading-relaxed max-w-xl'>
                      Når du har funnet den rette bilen, starter du en dialog med forhandleren direkte
                      i plattformen. Avtal prøvekjøring, forhandle og fullfør kjøpet trygt.
                    </p>
                  </div>
                  <div className='w-32 h-32 bg-emerald-100 rounded-full flex items-center justify-center shrink-0'>
                    <CheckCircle2 className='w-16 h-16 text-emerald-700' />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className='py-24 bg-stone-50'>
          <div className='container mx-auto px-4'>
            <div className='text-center max-w-3xl mx-auto mb-16'>
              <h2 className='font-serif text-4xl md:text-5xl mb-6 text-balance'>Hvorfor velge AutoAnbud?</h2>
              <p className='text-lg text-muted-foreground'>
                Vi har bygget plattformen rundt det som faktisk betyr noe for deg som kjøper.
              </p>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto'>
              {[
                {
                  icon: Clock,
                  title: 'Spar tid',
                  desc: 'Ingen timevis med ringing og research. Én forespørsel, flere tilbud.',
                },
                {
                  icon: TrendingUp,
                  title: 'Bedre priser',
                  desc: 'Når forhandlere konkurrerer om din ordre, får du bedre tilbud.',
                },
                {
                  icon: ShieldCheck,
                  title: 'Trygt og sikkert',
                  desc: 'Alle forhandlere er verifiserte. Garanti og dokumentasjon på plass.',
                },
              ].map((b) => (
                <Card key={b.title} className='bg-white border-stone-200 shadow-sm hover:shadow-md transition-all duration-300'>
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
                Klar til å finne din neste bil?
              </h2>
              <p className='text-stone-400 text-lg leading-relaxed'>
                Det tar bare noen minutter. La forhandlerne komme til deg med sine beste tilbud.
              </p>
              <Button asChild size='lg' className='h-14 px-10 text-lg rounded-full bg-emerald-700 hover:bg-emerald-600'>
                <Link href={ctaHref}>
                  {ctaLabel} <ArrowRight className='ml-2 w-5 h-5' />
                </Link>
              </Button>
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
