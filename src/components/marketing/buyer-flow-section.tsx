import { ClipboardList, Inbox, MessageSquare, CheckCircle2 } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Opprett forespørsel',
    description: 'Beskriv bilen du ønsker — merke, modell, budsjett, kjørelengde, tilstand og dine preferanser. Legg til bilder hvis du har innbytte.',
  },
  {
    number: '02',
    icon: Inbox,
    title: 'Motta tilbud',
    description: 'Verifiserte forhandlere ser forespørselen din og sender skreddersydde tilbud med full spesifikasjon, pris og bilder.',
  },
  {
    number: '03',
    icon: MessageSquare,
    title: 'Chat og sammenlign',
    description: 'Sammenlign tilbudene side om side. Still spørsmål direkte til forhandlerne via plattformens chat.',
  },
  {
    number: '04',
    icon: CheckCircle2,
    title: 'Aksepter det beste',
    description: 'Velg tilbudet du foretrekker. Forespørselen lukkes automatisk, og alle andre tilbud avslås.',
  },
]

export function BuyerFlowSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">For kjøpere</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Slik fungerer det
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Fire enkle steg fra drøm til bil. Du har full kontroll hele veien.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-linear-to-r from-border to-transparent lg:block" />
              )}

              <div className="relative flex flex-col items-center text-center">
                <div className="mb-4 flex size-24 items-center justify-center rounded-2xl border-2 border-border bg-card transition-colors hover:border-emerald-700/50">
                  <step.icon className="size-10 text-emerald-900" />
                </div>

                <span className="mb-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                  Steg {step.number}
                </span>

                <h3 className="text-lg font-semibold text-foreground">
                  {step.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
