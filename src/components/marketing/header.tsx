'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Menu, Car } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  primaryHref: string
  primaryLabel: string
  secondaryHref: string | null
  secondaryLabel: string | null
}

const navLinks = [
  { href: '/how-it-works', label: 'Slik fungerer det' },
  { href: '/how-it-works/dealers', label: 'For forhandlere' },
  { href: '/about', label: 'Om oss' },
]

export function Header({ primaryHref, primaryLabel, secondaryHref, secondaryLabel }: HeaderProps) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-900">
            <Car className="size-5 text-white" />
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight text-foreground">AutoAnbud</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 md:flex">
          {secondaryHref && secondaryLabel && (
            <Button variant="ghost" asChild>
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>
          )}
          <Button asChild className="rounded-full bg-emerald-900 hover:bg-emerald-800">
            <Link href={primaryHref}>{primaryLabel}</Link>
          </Button>
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="size-5" />
              <span className="sr-only">Meny</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-left">
                <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-900">
                  <Car className="size-5 text-white" />
                </div>
                AutoAnbud
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-base font-medium text-foreground transition-colors hover:text-emerald-700"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
                {secondaryHref && secondaryLabel && (
                  <Button variant="outline" asChild className="w-full rounded-full">
                    <Link href={secondaryHref} onClick={() => setOpen(false)}>{secondaryLabel}</Link>
                  </Button>
                )}
                <Button asChild className="w-full rounded-full bg-emerald-900 hover:bg-emerald-800">
                  <Link href={primaryHref} onClick={() => setOpen(false)}>{primaryLabel}</Link>
                </Button>
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
