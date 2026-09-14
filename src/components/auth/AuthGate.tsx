import { useState, type ReactNode } from 'react'
import { Lock, LogIn, Sparkles, UserPlus } from 'lucide-react'
import { Card, CardContent } from '../ui/Card'
import { Button } from '../ui/Button'
import { AuthForm } from './AuthForm'
import { useAuth } from '../../hooks/useAuth'

/**
 * Wraps protected surfaces (Dashboard, Planner, saved homes/plans).
 *
 * Guests see a polished explanation + login/signup form — never a broken
 * page, never a redirect to a separate login screen. Auth is about SAVING,
 * so the gate makes that value explicit before asking for credentials.
 */
export function AuthGate({
  feature,
  reason,
  children,
}: {
  /** Short feature name shown in the heading, e.g. "Dashboard". */
  feature: string
  /** One sentence on why an account is needed for this feature. */
  reason: string
  children: ReactNode
}) {
  const { user, available, initializing } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>('signup')

  if (initializing) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-brand border-t-transparent" aria-label="Loading" />
      </div>
    )
  }

  if (user) return <>{children}</>

  // Supabase not configured: explain demo/local mode instead of faking auth.
  if (!available) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <Sparkles className="size-6" aria-hidden />
          </span>
          <h2 className="mt-4 font-display text-xl font-bold text-text-strong">{feature} needs an account</h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-text-muted">
            {reason} Account features require Supabase credentials — until then your data stays
            in this browser, and all calculations and AI insights keep working.
          </p>
          <div className="mt-6">
            <Button to="/onboarding" variant="secondary">
              Continue exploring
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mx-auto max-w-xl overflow-hidden">
      <div className="border-b border-border-base bg-brand-softer px-6 py-6 text-center sm:px-8">
        <span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-brand text-brand-contrast shadow-sm">
          <Lock className="size-5" aria-hidden />
        </span>
        <h2 className="mt-3 font-display text-xl font-bold tracking-tight text-text-strong">
          {feature} is part of your saved GreenPlan
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-text-muted">{reason}</p>
      </div>
      <CardContent className="py-6">
        <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-surface-muted p-1">
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={
              mode === 'signup'
                ? 'flex items-center justify-center gap-1.5 rounded-lg bg-surface-card px-3 py-2 text-sm font-semibold text-text-strong shadow-sm transition-all'
                : 'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-all hover:text-text-strong'
            }
          >
            <UserPlus className="size-4" aria-hidden /> Sign up
          </button>
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={
              mode === 'signin'
                ? 'flex items-center justify-center gap-1.5 rounded-lg bg-surface-card px-3 py-2 text-sm font-semibold text-text-strong shadow-sm transition-all'
                : 'flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-text-muted transition-all hover:text-text-strong'
            }
          >
            <LogIn className="size-4" aria-hidden /> Log in
          </button>
        </div>
        <AuthForm startMode={mode} />
      </CardContent>
    </Card>
  )
}
