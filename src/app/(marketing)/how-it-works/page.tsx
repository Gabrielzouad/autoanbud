import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CarFront,
  CheckCircle2,
  ClipboardList,
  FileText,
  Handshake,
  Lock,
  MessageSquare,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Store,
  UserCheck,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Footer } from '@/components/marketing/footer';
import { Header } from '@/components/marketing/header';
import { getMarketingNavigationState } from '@/lib/marketing/navigation';

const buyerSteps = [
  {
    icon: ClipboardList,
    title: 'Opprett forespørsel',
    description:
      'Beskriv bilen du ser etter. Du kan være konkret med merke og modell, eller lage et åpent søk basert på behov, budsjett og bruksområde.',
  },
  {
    icon: Sparkles,
    title: 'Vi matcher forespørselen',
    description:
      'Forespørselen rutes til relevante, verifiserte forhandlere basert på lokasjon, biltype, budsjett og forhandlerens kapasiteter.',
  },
  {
    icon: MessageSquare,
    title: 'Sammenlign kvalitet',
    description:
      'Se tilbud med bilinformasjon, levering, garanti, finansiering og forhandlerdetaljer. Pris er bare én del av vurderingen.',
  },
  {
    icon: Handshake,
    title: 'Velg beste match',
    description:
      'Når et tilbud passer, aksepterer du det og fortsetter dialogen med forhandleren. Du er ikke forpliktet til å kjøpe.',
  },
];

const dealerSteps = [
  {
    icon: Store,
    title: 'Registrer forhandleren',
    description:
      'Opprett konto, legg inn bedriftsinformasjon og fullfør verifisering før du kan sende tilbud.',
  },
  {
    icon: SlidersHorizontal,
    title: 'Sett kapasiteter',
    description:
      'Velg merker, biltyper, prisklasser og geografisk område slik at du bare får relevante forespørsler.',
  },
  {
    icon: Bell,
    title: 'Motta kvalifiserte leads',
    description:
      'Dashboardet viser forespørsler som passer forhandleren din. Du velger selv hvilke du vil følge opp.',
  },
  {
    icon: Send,
    title: 'Send verdi-orienterte tilbud',
    description:
      'Tilbud bør inneholde mer enn pris: levering, garanti, inspeksjon, finansiering, service og tydelig bilinformasjon.',
  },
];

const trustItems = [
  {
    icon: UserCheck,
    title: 'Verifiserte forhandlere',
    description:
      'Forhandlere må ha en godkjent profil før de kan svare på kjøpsforespørsler.',
  },
  {
    icon: ShieldCheck,
    title: 'Begrenset antall tilbud',
    description:
      'Forespørsler har et tilbudstak for å redusere støy og holde kvaliteten høy.',
  },
  {
    icon: Lock,
    title: 'Kontrollert dialog',
    description:
      'Meldinger skjer i plattformen, og personlig kontaktinformasjon trenger ikke deles før du er klar.',
  },
];

const faqItems = [
  {
    question: 'Er AutoAnbud en auksjon?',
    answer:
      'Nei. Pris alene avgjør ikke. Tilbud vurderes på total verdi, inkludert bilens relevans, garanti, levering, finansiering, service og forhandlerens tillitssignaler.',
  },
  {
    question: 'Må kjøperen velge et tilbud?',
    answer:
      'Nei. En forespørsel er uforpliktende. Kjøperen kan stille spørsmål, vente på bedre match eller la forespørselen utløpe.',
  },
  {
    question: 'Hva er forskjellen på spesifikt og åpent søk?',
    answer:
      'Spesifikt søk brukes når kjøperen vet merke og modell. Åpent søk brukes når behovet er viktigst, for eksempel familie-SUV, elbil, lav kilometerstand eller bestemt budsjett.',
  },
  {
    question: 'Hvordan fungerer varsler?',
    answer:
      'Kjøpere og forhandlere får varsler i plattformen, og e-post kan sendes for viktige hendelser som nye tilbud og nye meldinger.',
  },
  {
    question: 'Hva koster det?',
    answer:
      'Det er gratis for kjøpere å opprette forespørsler. Forhandlermodellen bør baseres på kvalifisert tilgang og tydelig verdi, ikke volum av svar.',
  },
];

export default async function HowItWorksPage() {
  const nav = await getMarketingNavigationState();
  const isLoggedIn = nav.userRole !== null;
  const buyerHref = isLoggedIn ? nav.heroBuyerHref : '/select-role';
  const dealerHref = isLoggedIn ? nav.heroDealerHref : '/select-role';

  return (
    <div className='flex min-h-screen flex-col'>
      <Header
        primaryHref={nav.headerPrimaryHref}
        primaryLabel={nav.headerPrimaryLabel}
        secondaryHref={nav.headerSecondaryHref}
        secondaryLabel={nav.headerSecondaryLabel}
      />

      <main className='flex-1'>
        <section className='relative overflow-hidden bg-stone-950 text-white'>
          <div className='absolute inset-0'>
            <Image
              src='/images/handshake-car-keys-luxury-dark.jpg'
              alt=''
              fill
              priority
              className='object-cover opacity-45'
            />
            <div className='absolute inset-0 bg-linear-to-r from-stone-950 via-stone-950/90 to-stone-950/55' />
          </div>

          <div className='relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8'>
            <div className='max-w-3xl'>
              <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-sm text-stone-200 backdrop-blur-sm'>
                <CarFront className='size-4 text-emerald-300' />
                Slik fungerer AutoAnbud
              </div>

              <h1 className='text-balance font-serif text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl'>
                En tryggere måte å finne riktig bil og riktig forhandler.
              </h1>

              <p className='mt-6 max-w-2xl text-lg leading-8 text-stone-300'>
                AutoAnbud er en forespørselsdrevet markedsplass. Kjøpere
                beskriver behovet sitt, og relevante forhandlere kan sende
                gjennomarbeidede tilbud basert på kvalitet, tillit og god match.
              </p>

              <div className='mt-10 flex flex-col gap-3 sm:flex-row'>
                <Button
                  asChild
                  size='lg'
                  className='rounded-full bg-emerald-700 hover:bg-emerald-600'
                >
                  <Link href={buyerHref}>
                    Start som kjøper
                    <ArrowRight className='ml-2 size-4' />
                  </Link>
                </Button>
                <Button
                  asChild
                  size='lg'
                  variant='outline'
                  className='rounded-full border-white/25 bg-white/10 text-white hover:bg-white/20'
                >
                  <Link href={dealerHref}>Registrer forhandler</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className='border-b border-stone-200 bg-white py-10'>
          <div className='mx-auto grid max-w-7xl gap-4 px-4 sm:px-6 md:grid-cols-3 lg:px-8'>
            {trustItems.map((item) => (
              <div key={item.title} className='flex gap-4'>
                <div className='flex size-11 shrink-0 items-center justify-center rounded-lg bg-emerald-900/10'>
                  <item.icon className='size-5 text-emerald-800' />
                </div>
                <div>
                  <h2 className='font-medium text-stone-950'>{item.title}</h2>
                  <p className='mt-1 text-sm leading-6 text-stone-600'>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id='buyers' className='bg-stone-50 py-20'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start'>
              <div>
                <p className='text-sm font-semibold uppercase tracking-wider text-emerald-700'>
                  For kjøpere
                </p>
                <h2 className='mt-3 font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl'>
                  Fra behov til relevante tilbud
                </h2>
                <p className='mt-4 text-lg leading-8 text-stone-600'>
                  Du trenger ikke vite alt om bilen på forhånd. Fortell hva du
                  trenger, hvor du holder til og hva som er viktig. Plattformen
                  hjelper med å strukturere forespørselen slik at forhandlere
                  kan svare presist.
                </p>
                <div className='mt-8 rounded-lg border border-stone-200 bg-white p-5'>
                  <h3 className='font-medium text-stone-950'>
                    Dette bør du legge inn
                  </h3>
                  <ul className='mt-4 space-y-3 text-sm text-stone-600'>
                    {[
                      'Budsjett og ønsket bruksområde',
                      'Spesifikk modell eller åpent behov',
                      'Lokasjon og ønsket leveringsområde',
                      'Finansiering, innbytte og viktige preferanser',
                    ].map((item) => (
                      <li key={item} className='flex gap-2'>
                        <CheckCircle2 className='mt-0.5 size-4 shrink-0 text-emerald-700' />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                {buyerSteps.map((step, index) => (
                  <Card key={step.title} className='border-stone-200 bg-white'>
                    <CardContent className='p-6'>
                      <div className='flex items-center justify-between gap-4'>
                        <div className='flex size-12 items-center justify-center rounded-lg bg-emerald-900/10'>
                          <step.icon className='size-6 text-emerald-800' />
                        </div>
                        <span className='font-serif text-4xl font-semibold text-stone-200'>
                          {String(index + 1).padStart(2, '0')}
                        </span>
                      </div>
                      <h3 className='mt-5 font-serif text-xl font-semibold text-stone-950'>
                        {step.title}
                      </h3>
                      <p className='mt-3 text-sm leading-6 text-stone-600'>
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id='dealers' className='bg-white py-20'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='mb-12 max-w-3xl'>
              <p className='text-sm font-semibold uppercase tracking-wider text-emerald-700'>
                For forhandlere
              </p>
              <h2 className='mt-3 font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl'>
                Kvalifisert tilgang, ikke støy
              </h2>
              <p className='mt-4 text-lg leading-8 text-stone-600'>
                Forhandlere får kontroll over hvilke forespørsler de følger opp.
                Målet er færre, bedre leads med tydelig behov og høyere
                relevans.
              </p>
            </div>

            <div className='grid gap-5 md:grid-cols-2 lg:grid-cols-4'>
              {dealerSteps.map((step, index) => (
                <Card key={step.title} className='border-stone-200 bg-stone-50'>
                  <CardContent className='p-6'>
                    <div className='mb-5 flex items-center justify-between'>
                      <div className='flex size-12 items-center justify-center rounded-lg bg-stone-950 text-white'>
                        <step.icon className='size-6' />
                      </div>
                      <span className='text-sm font-semibold text-stone-400'>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className='font-serif text-xl font-semibold text-stone-950'>
                      {step.title}
                    </h3>
                    <p className='mt-3 text-sm leading-6 text-stone-600'>
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className='bg-stone-950 py-20 text-white'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center'>
              <div>
                <div className='mb-5 flex size-14 items-center justify-center rounded-xl bg-emerald-500/15'>
                  <BadgeCheck className='size-7 text-emerald-300' />
                </div>
                <h2 className='font-serif text-3xl font-semibold tracking-tight sm:text-4xl'>
                  Slik holder vi kvaliteten oppe
                </h2>
                <p className='mt-4 text-lg leading-8 text-stone-300'>
                  AutoAnbud er bygget for gode beslutninger, ikke flest mulig
                  svar. Derfor prioriterer plattformen verifisering,
                  tilbudsgrenser og tydelige kvalitetssignaler.
                </p>
              </div>

              <div className='grid gap-4 sm:grid-cols-2'>
                {[
                  'Forhandlere må være verifisert før de kan sende tilbud.',
                  'Forespørsler kan begrenses til et håndterbart antall tilbud.',
                  'Tilbud bør inneholde garanti, levering, finansiering og serviceinformasjon.',
                  'Kjøpere kan sammenligne total verdi, ikke bare pris.',
                ].map((item) => (
                  <div
                    key={item}
                    className='rounded-lg border border-white/10 bg-white/5 p-5'
                  >
                    <CheckCircle2 className='mb-3 size-5 text-emerald-300' />
                    <p className='text-sm leading-6 text-stone-200'>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className='bg-stone-50 py-20'>
          <div className='mx-auto max-w-4xl px-4 sm:px-6 lg:px-8'>
            <div className='text-center'>
              <p className='text-sm font-semibold uppercase tracking-wider text-emerald-700'>
                Ofte stilte spørsmål
              </p>
              <h2 className='mt-3 font-serif text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl'>
                Viktig å vite før du starter
              </h2>
            </div>

            <div className='mt-10 divide-y divide-stone-200 rounded-lg border border-stone-200 bg-white'>
              {faqItems.map((item) => (
                <div key={item.question} className='p-6'>
                  <h3 className='font-medium text-stone-950'>
                    {item.question}
                  </h3>
                  <p className='mt-3 text-sm leading-6 text-stone-600'>
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className='bg-white py-20'>
          <div className='mx-auto max-w-7xl px-4 sm:px-6 lg:px-8'>
            <div className='rounded-2xl bg-emerald-900 px-6 py-12 text-center text-white sm:px-12'>
              <FileText className='mx-auto mb-5 size-10 text-emerald-200' />
              <h2 className='font-serif text-3xl font-semibold tracking-tight sm:text-4xl'>
                Klar til å starte?
              </h2>
              <p className='mx-auto mt-4 max-w-2xl text-emerald-50'>
                Velg rollen som passer deg. Kjøpere kan opprette forespørsel,
                og forhandlere kan fullføre profil og verifisering.
              </p>
              <div className='mt-8 flex flex-col justify-center gap-3 sm:flex-row'>
                <Button asChild size='lg' className='rounded-full bg-white text-emerald-950 hover:bg-emerald-50'>
                  <Link href={buyerHref}>Jeg vil kjøpe bil</Link>
                </Button>
                <Button asChild size='lg' variant='outline' className='rounded-full border-white/35 bg-transparent text-white hover:bg-white/10'>
                  <Link href={dealerHref}>Jeg er forhandler</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
