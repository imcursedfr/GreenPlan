import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { authService, type AuthState } from '../services/authService'

interface AuthContextValue extends AuthState {
  signUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Guest-first auth context.
 *
 * The app is fully usable with `user === null` (guest mode). Auth becomes
 * relevant only for saving profiles and plans.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthState['user']>(null)
  const [session, setSession] = useState<AuthState['session']>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let mounted = true
    authService
      .getSession()
      .then((existing) => {
        if (!mounted) return
        setSession(existing)
        setUser(existing?.user ?? null)
      })
      .finally(() => {
        if (mounted) setInitializing(false)
      })

    const unsubscribe = authService.onAuthStateChange((next) => {
      setSession(next)
      setUser(next?.user ?? null)
    })
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    return authService.signUp(email, password)
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    await authService.signIn(email, password)
  }, [])

  const signOut = useCallback(async () => {
    await authService.signOut()
  }, [])

  const value = useMemo(
    () => ({
      user,
      session,
      available: authService.isAvailable(),
      initializing,
      signUp,
      signIn,
      signOut,
    }),
    [user, session, initializing, signUp, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
