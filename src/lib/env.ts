/**
 * Central environment access. Every variable is read lazily via a getter so
 * importing this module never crashes at load time (important for tests and
 * for tooling that runs outside Vite). Accessors throw a descriptive error
 * only when a missing variable is actually *used*.
 *
 * VITE_* variables are public by design (inlined into the browser bundle).
 * Never place private secrets in VITE_* variables — server-side secrets for
 * the AI gateway will live in serverless functions during V2.
 */

function read(name: string): string | undefined {
  const scope = import.meta.env as Record<string, string | undefined>
  return scope[name]
}

export const env = {
  get supabaseUrl() {
    return read('VITE_SUPABASE_URL')
  },
  get supabaseAnonKey() {
    return read('VITE_SUPABASE_ANON_KEY')
  },
  get aiBaseUrl() {
    return read('VITE_AI_BASE_URL')
  },
  get aiModel() {
    return read('VITE_AI_MODEL')
  },
  /** Optional gateway token; a Vercel-managed gateway may not need one. */
  get aiApiKey() {
    return read('VITE_AI_API_KEY')
  },
} as const

export function requireSupabaseEnv(): { url: string; anonKey: string } {
  const url = env.supabaseUrl
  const anonKey = env.supabaseAnonKey
  if (!url || !anonKey) {
    throw new Error(
      '[env] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. ' +
        'Copy .env.example to .env and fill in your Supabase project values.',
    )
  }
  return { url, anonKey }
}
