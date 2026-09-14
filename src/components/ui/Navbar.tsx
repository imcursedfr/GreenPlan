import { Link } from 'react-router-dom'
import { Leaf } from 'lucide-react'
import { Button } from './Button'
import { ThemeSwitcher } from './ThemeSwitcher'

export interface NavbarLink {
  label: string
  href: string
}

interface NavbarProps {
  links?: NavbarLink[]
}

/** Marketing navbar: brand, anchor links, theme switcher and the primary CTA. */
export function Navbar({ links = [] }: NavbarProps) {
  return (
    <header className="absolute inset-x-0 top-0 z-40">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-brand-contrast shadow-sm">
            <Leaf className="size-5" aria-hidden />
          </span>
          <span className="font-display text-base font-bold tracking-tight text-text-strong">
            Green<span className="text-brand">Plan</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-text-body md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-text-strong">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <ThemeSwitcher />
          <Button to="/onboarding" size="sm">
            Explore GreenPlan
          </Button>
        </div>
      </div>
    </header>
  )
}
