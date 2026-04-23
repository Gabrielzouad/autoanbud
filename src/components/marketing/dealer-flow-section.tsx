import Image from 'next/image'
import { Search, Send, MessageSquare, Handshake } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: Search,
    title: 'Bla i forespørsler',
    description: 'Se aktive kjøpsforespørsler med AI-matchscore basert på ditt lager og preferanser. Filtrer på merke, budsjett og lokasjon.',
  },
  {
    number: '02',
    icon: Send,
    title: 'Send tilbud',
    description: 'Velg en bil fra lageret ditt og send et detaljert tilbud med registreringsnummer, km-stand, pris og bilder.',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Chat med kjøper',
    description: 'Svar på spørsmål og bygg tillit gjennom plattformens sikre chat. All kommunikasjon logges.',
  },
  {
    number: '04',
    icon: Handshake,
    title: 'Fullfør salget',
    description: 'Kjøperen aksepterer tilbudet ditt. Dere avtaler levering og gjennomfører handelen utenfor plattformen.',
  },
]

export function DealerFlowSection() {
  return (
    <section className="relative overflow-hidden bg-foreground py-24 text-background">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-20">
        <Image
          src="/images/modern-car-dealership-showroom-architecture.jpg"
          alt=""
          fill
          className="object-cover"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-400">For forhandlere</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Møt kjøpere der de er
          </h2>
          <p className="mt-4 text-lg opacity-80">
            Slutt på kaldekontakt og dyre annonser. Nå kunder som aktivt søker det du selger.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div
              key={step.number}
              className="group rounded-2xl border border-background/10 bg-background/5 p-6 backdrop-blur-sm transition-all hover:bg-background/10"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-emerald-400/20">
                <step.icon className="size-6 text-emerald-400" />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Steg {step.number}
              </span>

              <h3 className="mt-2 text-lg font-semibold">
                {step.title}
              </h3>

              <p className="mt-2 text-sm leading-relaxed opacity-70">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 grid grid-cols-2 gap-8 border-t border-background/10 pt-8 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-400">85%</p>
            <p className="mt-1 text-sm opacity-70">Åpningsrate på tilbud</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-400">3.2x</p>
            <p className="mt-1 text-sm opacity-70">Høyere konvertering vs. annonser</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-400">5 min</p>
            <p className="mt-1 text-sm opacity-70">Gj.snitt tid per tilbud</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-400">0 kr</p>
            <p className="mt-1 text-sm opacity-70">Kostnad ved ingen salg</p>
          </div>
        </div>
      </div>
    </section>
  )
}
