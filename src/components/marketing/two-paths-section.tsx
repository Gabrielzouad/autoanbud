import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Store, ArrowRight, AlertTriangle } from 'lucide-react'

export function TwoPathsSection() {
  return (
    <section className="bg-card py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Velg din rolle
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            AutoAnbud har to separate brukertyper. Velg den som passer deg.
          </p>
        </div>

        <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Viktig: Rollevalget er permanent
            </p>
            <p className="mt-1 text-sm text-amber-700">
              Kjøpere og forhandlere har helt separate kontoer og tilganger. Du kan ikke bytte rolle etter registrering.
            </p>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {/* Buyer Path */}
          <Card className="relative overflow-hidden border-2 transition-all hover:border-emerald-700/50 hover:shadow-lg">
            <div className="absolute right-0 top-0 size-32 -translate-y-8 translate-x-8 rounded-full bg-emerald-900/5" />
            <CardHeader className="pb-4">
              <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-emerald-900/10">
                <ShoppingCart className="size-7 text-emerald-900" />
              </div>
              <CardTitle className="text-2xl">Jeg vil kjøpe bil</CardTitle>
              <CardDescription className="text-base">
                Beskriv bilen du ønsker og motta tilbud fra forhandlere i hele Norge.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-700" />
                  Opprett én forespørsel — få mange tilbud
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-700" />
                  Chat direkte med forhandlere i plattformen
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-700" />
                  Helt gratis — ingen skjulte kostnader
                </li>
              </ul>
              <Button asChild className="mt-6 w-full gap-2 rounded-full bg-emerald-900 hover:bg-emerald-800">
                <Link href="/select-role?role=buyer">
                  Kom i gang som kjøper
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Dealer Path */}
          <Card className="relative overflow-hidden border-2 transition-all hover:border-emerald-700/50 hover:shadow-lg">
            <div className="absolute right-0 top-0 size-32 -translate-y-8 translate-x-8 rounded-full bg-emerald-700/5" />
            <CardHeader className="pb-4">
              <div className="mb-4 flex size-14 items-center justify-center rounded-xl bg-emerald-700/10">
                <Store className="size-7 text-emerald-700" />
              </div>
              <CardTitle className="text-2xl">Jeg er forhandler</CardTitle>
              <CardDescription className="text-base">
                Se aktive kjøpsforespørsler og send tilbud direkte til motiverte kjøpere.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-700" />
                  Tilgang til live-feed med matchende forespørsler
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-700" />
                  AI-drevet matching basert på ditt lager
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 size-1.5 shrink-0 rounded-full bg-emerald-700" />
                  Ingen kaldekontakt — kun motiverte kjøpere
                </li>
              </ul>
              <Button asChild variant="outline" className="mt-6 w-full gap-2 rounded-full">
                <Link href="/select-role?role=dealer">
                  Registrer forhandlervirksomhet
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
