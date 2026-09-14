import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  Droplets,
  Fan,
  LayoutDashboard,
  Leaf,
  ClipboardList,
  Menu,
  Recycle,
  Route as RouteIcon,
  Sun,
  UserCircle2,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { cx } from '../lib/cx'
import { ThemeSwitcher } from '../components/ui/ThemeSwitcher'
import { HomeSwitcher } from '../components/homes/HomeSwitcher'

/** Primary navigation for the product area. */
const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, protected: true },
  { to: '/onboarding', label: 'Home setup', icon: ClipboardList, protected: false },
  { to: '/solar', label: 'Solar', icon: Sun, protected: false },
  { to: '/water', label: 'Water', icon: Droplets, protected: false },
  { to: '/efficiency', label: 'Efficiency', icon: Fan, protected: false },
  { to: '/waste', label: 'Waste', icon: Recycle, protected: false },
  { to: '/planner', label: 'Planner', icon: RouteIcon, protected: true },
  { to: '/account', label: 'My GreenPlans', icon: UserCircle2, protected: false },
]

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-1">
      <span className="flex size-9 items-center justify-center rounded-xl bg-brand text-brand-contrast shadow-sm">
        <Leaf className="size-5" aria-hidden />
      </span>
      <span className="font-display text-base font-bold tracking-tight text-text-strong">
        Green<span className="text-brand">Plan</span>
      </span>
    </Link>
  )
}

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cx(
    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
    isActive
      ? 'bg-brand text-brand-contrast shadow-[0_4px_16px_-4px_var(--brand)]'
      : 'text-text-body hover:translate-x-0.5 hover:bg-surface-hover hover:text-text-strong active:translate-x-0',
  )

/**
 * Product layout: fixed glass sidebar on desktop, collapsible glass top bar
 * on mobile. Floating card feel — soft borders, blur, restrained shadows —
 * with the home switcher pinned above navigation.
 */
export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user } = useAuth()

  const navList = (onNavigate?: () => void) => (
    <ul className="space-y-1.5">
      {navItems.map(({ to, label, icon: Icon, protected: isProtected }) => (
        <li key={to}>
          <NavLink
            to={to}
            onClick={onNavigate}
            className={navLinkClass}
            aria-label={isProtected && !user ? `${label} (account required)` : label}
          >
            {({ isActive }: { isActive: boolean }) => (
              <>
                <Icon
                  className={cx(
                    'size-4.5 shrink-0 transition-transform duration-200 group-hover:scale-105',
                    isActive ? 'drop-shadow-sm' : '',
                  )}
                  aria-hidden
                />
                {label}
                {isProtected && !user && (
                  <span
                    className="ml-auto size-1.5 rounded-full bg-text-faint/60"
                    aria-label="Account required"
                    title="Account required"
                  />
                  )}
              </>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )

  return (
    <div className="min-h-dvh bg-surface-page">
      {/* Mobile glass top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border-base bg-surface-card/80 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Brand />
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-surface-hover hover:text-text-strong"
            aria-expanded={mobileOpen}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </header>

      {mobileOpen && (
        <nav
          className="border-b border-border-base bg-surface-card/95 px-4 pb-4 pt-2 backdrop-blur-xl lg:hidden"
          aria-label="Mobile"
        >
          <div className="mb-3">
            <HomeSwitcher />
          </div>
          {navList(() => setMobileOpen(false))}
        </nav>
      )}

      <div className="mx-auto flex w-full max-w-7xl">
        {/* Desktop floating glass sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col px-3 py-5 lg:flex">
          <div className="flex h-full flex-col rounded-3xl border border-border-base bg-surface-card/70 shadow-card backdrop-blur-xl">
            <div className="px-4 pb-4 pt-5">
              <Brand />
            </div>
            <div className="px-3">
              <HomeSwitcher />
            </div>
            <nav className="mt-4 flex-1 overflow-y-auto px-3 pb-3" aria-label="Primary">
              {navList()}
            </nav>
            <div className="space-y-3 border-t border-border-base px-4 py-4">
              {!user && (
                <Link
                  to="/account"
                  className="flex items-center gap-2.5 rounded-xl bg-brand-soft px-3 py-2.5 text-xs font-semibold text-brand-text transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card"
                >
                  <UserCircle2 className="size-4.5 shrink-0" aria-hidden />
                  <span>
                    Save your GreenPlan
                    <span className="block font-normal text-text-muted">Optional account</span>
                  </span>
                </Link>
              )}
              <ThemeSwitcher align="left" />
              <p className="px-1 text-xs leading-relaxed text-text-faint">
                Deterministic calculations · centralized AI · PRISM-ready
              </p>
            </div>
          </div>
        </aside>

        {/* Content column */}
        <main className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-10">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
