import type { HomeProfile } from '../types'
import { getSupabase } from './supabaseClient'

/**
 * Data access for home profiles.
 *
 * Step 1 keeps this minimal and typed: the UI goes through these functions
 * rather than importing supabase directly, so the future schema (homes,
 * energy_profiles, water_profiles, assessments, recommendations) can be
 * introduced by editing this layer only.
 */

const TABLE = 'homes'

/** Fetch all saved home profiles for the current Supabase user. */
export async function listHomes(): Promise<HomeProfile[]> {
  const supabase = getSupabase()
  if (!supabase) return [] // No credentials: nothing persisted yet.
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as HomeProfile[]
}

/** Persist a home profile; returns the stored row. */
export async function saveHome(home: HomeProfile): Promise<HomeProfile> {
  const supabase = getSupabase()
  if (!supabase) {
    throw new Error('Saving homes requires Supabase credentials (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).')
  }
  const { data, error } = await supabase
    .from(TABLE)
    .insert(home)
    .select()
    .single()

  if (error) throw error
  return data as HomeProfile
}

/**
 * Placeholder for the assessments table access that arrives with the real
 * schema in a later step. Exists so routing/API decisions have a home now.
 */
export async function saveAssessment(_assessment: unknown): Promise<void> {
  throw new Error('saveAssessment: not implemented until the schema step')
}
