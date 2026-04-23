import Image from 'next/image'
import { ShieldCheck, Lock, UserCheck } from 'lucide-react'

const trustPoints = [
  {
    icon: UserCheck,
    title: 'Kun verifiserte forhandlere',
    description: 'Alle forhandlere må verifisere organisasjonsnummer og kontaktinformasjon før de kan sende tilbud. Du vet hvem du handler med.',
  },
  {
    icon: Lock,
    title: 'Sikker kommunikasjon',
    description: 'All chat skjer i plattformen. Personlig kontaktinformasjon deles ikke før du aksepterer et tilbud.',
  },
  {
    icon: ShieldCheck,
    title: 'Du har kontrollen',
    description: 'Godta eller avslå hvert tilbud på dine vilkår. Ingen forpliktelser, ingen press. Når du er klar, velger du selv.',
  },
]

export function TrustSection() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image */}
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl lg:aspect-square">
            <Image
              src="/images/handshake-car-keys-luxury-dark.jpg"
              alt="Profesjonell bilhandel"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-foreground/40 to-transparent" />
          </div>

          {/* Content */}
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Trygghet først</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Bilkjøp du kan stole på
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Vi vet at å kjøpe bil er en stor beslutning. Derfor har vi bygget AutoAnbud med
              fokus på trygghet, transparens og kontroll.
            </p>

            <div className="mt-10 space-y-8">
              {trustPoints.map((point) => (
                <div key={point.title} className="flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-emerald-900/10">
                    <point.icon className="size-6 text-emerald-900" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{point.title}</h3>
                    <p className="mt-1 text-muted-foreground">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
