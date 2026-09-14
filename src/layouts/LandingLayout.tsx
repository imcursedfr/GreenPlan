import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/ui/Navbar'

const navbarLinks = [
  { label: 'How it works', href: '/#how-it-works' },
  { label: 'Modules', href: '/#modules' },
  { label: 'Planner', href: '/planner' },
]

/** Marketing layout: navbar over the landing page + footer. */
export function LandingLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-card">
      <Navbar links={navbarLinks} />

      <div className="flex-1">
        <Outlet />
      </div>

      <footer className="border-t border-border-base">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-text-muted sm:flex-row sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} GreenPlan</p>
          <p className="text-text-faint">Deterministic analysis · AI-personalized · PRISM-ready</p>
        </div>
      </footer>
    </div>
  )
}
