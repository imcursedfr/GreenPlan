import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { env } from '../lib/env'

/**
 * Lazy, defensive Supabase singleton.
 *
 * The client is created on first use (not at module import), and a
 * missing/invalid configuration NEVER throws — it yields `null` so every
 * consumer falls back to guest/demo/localStorage mode. The app must render
 * without Supabase credentials.
 */

let client: SupabaseClient | null = null

function isValidHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

/** True when both env vars are present and the URL is a valid http(s) URL. */
export function hasSupabaseCredentials(): boolean {
  const url = env.supabaseUrl
  const anonKey = env.supabaseAnonKey
  return Boolean(url && anonKey && isValidHttpUrl(url))
}

/**
 * Returns the Supabase client, or `null` when credentials are missing or
 * invalid. Callers must handle `null` (guest/demo mode). Never throws.
 */
export function getSupabase(): SupabaseClient | null {
  if (client) return client
  if (!hasSupabaseCredentials()) return null
  try {
    client = createClient(env.supabaseUrl as string, env.supabaseAnonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
    return client
  } catch {
    // Malformed credentials of any kind: degrade to local mode.
    return null
  }
}

/** For tests or hard resets only. */
export function resetSupabaseForTests(): void {
  client = null
}
