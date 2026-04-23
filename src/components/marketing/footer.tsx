import Link from 'next/link'
import { Car } from 'lucide-react'

const footerLinks = {
  product: {
    title: 'Produkt',
    links: [
      { href: '/how-it-works/buyers', label: 'Slik fungerer det — Kjøpere' },
      { href: '/how-it-works/dealers', label: 'Slik fungerer det — Forhandlere' },
      { href: '/select-role', label: 'Kom i gang' },
    ],
  },
  company: {
    title: 'Selskap',
    links: [
      { href: '/about', label: 'Om oss' },
      { href: '/contact', label: 'Kontakt' },
    ],
  },
  legal: {
    title: 'Juridisk',
    links: [
      { href: '/privacy', label: 'Personvern' },
      { href: '/terms', label: 'Vilkår' },
    ],
  },
  account: {
    title: 'Konto',
    links: [
      { href: '/handler/sign-in', label: 'Logg inn' },
      { href: '/select-role', label: 'Registrer deg' },
    ],
  },
}

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-900">
                <Car className="size-5 text-white" />
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight text-foreground">AutoAnbud</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Den smarte måten å kjøpe bil på. La forhandlerne konkurrere om deg.
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} AutoAnbud AS. Alle rettigheter reservert.
          </p>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span>Laget med</span>
            <span className="text-emerald-700">♥</span>
            <span>i Norge</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
