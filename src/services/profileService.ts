import type { PlannerProfile } from '../types/profile'
import { getSupabase, hasSupabaseCredentials } from './supabaseClient'

/**
 * Profile persistence behind a service boundary.
 *
 * When Supabase is available the profile is written to the `home_plans`
 * table (per-user row via RLS + auth). Without credentials the UI layer
 * falls back to localStorage so the product stays demo-ready.
 */
export const profileService = {
  isConfigured: false,

  async saveProfile(profile: PlannerProfile): Promise<void> {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Saving to the cloud is unavailable: Supabase is not configured.')

    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id ?? null

    const row = {
      user_id: userId,
      profile: profile,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('home_plans').upsert(row)
    if (error) throw error
  },

  async loadProfile(): Promise<PlannerProfile | null> {
    const supabase = getSupabase()
    if (!supabase) return null

    try {
      const { data, error } = await supabase
        .from('home_plans')
        .select('profile')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return (data?.profile as PlannerProfile | undefined) ?? null
    } catch {
      // Network/permission issues must not break local-mode usage.
      return null
    }
  },
}

/** True when Supabase credentials are valid (decides fallback behavior). */
export function isSupabaseConfigured(): boolean {
  return hasSupabaseCredentials()
}
