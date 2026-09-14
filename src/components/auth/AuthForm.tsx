import { useState, type FormEvent } from 'react'
import { Loader2, Mail, ShieldCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface AuthFormProps {
  /** Called after successful sign-in/sign-up. */
  onSuccess?: () => void
  compact?: boolean
  /** Force signup mode on mount (AuthGate manages its own tabs). */
  startMode?: 'signin' | 'signup'
}

/**
 * Supabase email/password auth form.
 * Framed around saving — never a barrier to exploring.
 */
export function AuthForm({ onSuccess, compact = false, startMode = 'signin' }: AuthFormProps) {
  const { signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>(startMode)
  const startModeForced = startMode !== 'signin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signup') {
        const result = await signUp(email.trim(), password)
        if (result.needsConfirmation) {
          setNotice('Check your inbox to confirm your email, then sign in.')
        } else {
          onSuccess?.()
        }
      } else {
        await signIn(email.trim(), password)
        onSuccess?.()
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Authentication failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!compact && (
        <div className="rounded-xl bg-brand-softer p-3.5 text-xs leading-relaxed text-brand-text">
          <span className="flex items-center gap-1.5 font-semibold">
            <ShieldCheck className="size-3.5" aria-hidden />
            Explore freely — save when you're ready
          </span>
          An account only stores your home profile, saved plans and progress.
        </div>
      )}

      <label className="block">
        <span className="text-sm font-medium text-text-strong">Email</span>
        <div className="relative mt-1.5">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-text-faint" aria-hidden />
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-border-base bg-surface-card py-2.5 pl-10 pr-4 text-sm text-text-strong placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-text-strong">Password</span>
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 6 characters"
          className="mt-1.5 w-full rounded-xl border border-border-base bg-surface-card px-4 py-2.5 text-sm text-text-strong placeholder:text-text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring/30"
        />
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-solar-soft px-3.5 py-2.5 text-xs leading-relaxed text-text-body">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-brand-softer px-3.5 py-2.5 text-xs leading-relaxed text-brand-text">
          {notice}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-contrast transition-all hover:bg-brand-strong disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>
      {!startModeForced && (
        <button
          type="button"
          onClick={() => {
            setMode((previous) => (previous === 'signin' ? 'signup' : 'signin'))
            setError(null)
            setNotice(null)
          }}
          className="text-center text-xs font-medium text-text-muted transition-colors hover:text-brand"
        >
          {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}
        </button>
      )}
    </form>
  )
}
