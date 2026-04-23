import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, ShieldCheck, Users, Zap } from 'lucide-react'

interface HeroSectionProps {
  primaryHref: string
  primaryLabel: string
  isLoggedIn: boolean
}

export function HeroSection({ primaryHref, primaryLabel, isLoggedIn }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/images/luxury-car-interior-minimalist.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/95 to-background/70" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm">
            <ShieldCheck className="size-4 text-emerald-700" />
            Kun verifiserte forhandlere
          </div>

          {/* Headline */}
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            La forhandlerne konkurrere om{' '}
            <span className="text-emerald-700">deg</span>
          </h1>

          {/* Supporting text */}
          <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Beskriv drømmebilen din én gang. Motta skreddersydde tilbud fra verifiserte forhandlere.
            Sammenlign, chat og velg det beste — helt gratis.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button size="lg" asChild className="gap-2 rounded-full bg-emerald-900 hover:bg-emerald-800">
              <Link href={primaryHref}>
                {primaryLabel}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            {!isLoggedIn && (
              <p className="text-sm text-muted-foreground">
                Ingen forpliktelser. Alltid gratis for kjøpere.
              </p>
            )}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 border-t border-border pt-8">
            <div>
              <div className="flex items-center gap-2">
                <Users className="size-5 text-emerald-700" />
                <span className="text-2xl font-bold text-foreground">150+</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Verifiserte forhandlere</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Zap className="size-5 text-emerald-700" />
                <span className="text-2xl font-bold text-foreground">{"<"}24t</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Gj.snitt responstid</p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-5 text-emerald-700" />
                <span className="text-2xl font-bold text-foreground">100%</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">Gratis for kjøpere</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
