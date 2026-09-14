import type { Session, User } from '@supabase/supabase-js'
import { getSupabase, hasSupabaseCredentials } from './supabaseClient'

/**
 * Supabase Auth wrapper.
 *
 * Guest-first philosophy: nothing here blocks usage — auth exists purely to
 * enable saving. When Supabase is unavailable (missing/invalid credentials),
 * `isAvailable()` is false and the UI hides account actions while everything
 * else works in local/demo mode.
 */

export interface AuthState {
  user: User | null
  session: Session | null
  /** Supabase credentials valid (auth feature available). */
  available: boolean
  /** True while the initial session check is in flight. */
  initializing: boolean
}

export const authService = {
  isAvailable: hasSupabaseCredentials,

  async getSession(): Promise<Session | null> {
    const supabase = getSupabase()
    if (!supabase) return null
    try {
      const { data } = await supabase.auth.getSession()
      return data.session
    } catch {
      return null
    }
  },

  async signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }> {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Account creation is unavailable: Supabase is not configured.')
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error
    // Email confirmation requirement depends on the Supabase project settings.
    return { needsConfirmation: !data.session }
  },

  async signIn(email: string, password: string): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Sign-in is unavailable: Supabase is not configured.')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  async signOut(): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) return
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  onAuthStateChange(callback: (session: Session | null) => void): () => void {
    const supabase = getSupabase()
    if (!supabase) return () => {}
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session)
    })
    return () => data.subscription.unsubscribe()
  },
}
