import type { PlannerProfile } from '../types/profile'
import { getSupabase } from './supabaseClient'

/**
 * Multiple homes per user.
 *
 * A HomeRecord wraps a full PlannerProfile plus a user-chosen name. Storage
 * strategy mirrors the rest of the app:
 *  - Supabase `green_homes` table when credentials + signed-in user exist
 *  - localStorage otherwise (guest/demo mode) — full functionality preserved
 *
 * Each home owns its own profile, so calculations/planner/AI never mix data
 * across homes: switching the active home swaps the profile atomically.
 */

export interface HomeRecord {
  id: string
  name: string
  profile: PlannerProfile
  createdAt: string
  updatedAt: string
}

const LOCAL_KEY = 'shp.homes.v1'
const ACTIVE_KEY = 'shp.activeHome.v1'

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `home_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function readLocal(): HomeRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as HomeRecord[]) : []
  } catch {
    return []
  }
}

function writeLocal(homes: HomeRecord[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(homes))
  } catch {
    /* ignore */
  }
}

export function readActiveHomeId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

export function writeActiveHomeId(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id)
    else localStorage.removeItem(ACTIVE_KEY)
  } catch {
    /* ignore */
  }
}

export const homesService = {
  async listHomes(userId: string | null): Promise<HomeRecord[]> {
    const supabase = getSupabase()
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('green_homes')
          .select('home')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
        if (!error && data) {
          return (data as Array<{ home: HomeRecord }>).map((row) => row.home)
        }
        // Table missing / permission error → fall through to local.
      } catch {
        /* fall through */
      }
    }
    return readLocal().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  async upsertHome(home: HomeRecord, userId: string | null): Promise<HomeRecord> {
    const stamped: HomeRecord = { ...home, updatedAt: new Date().toISOString() }
    const supabase = getSupabase()
    if (supabase && userId) {
      try {
        const { error } = await supabase
          .from('green_homes')
          .upsert({ id: stamped.id, user_id: userId, home: stamped, updated_at: stamped.updatedAt })
        if (error) throw error
        return stamped
      } catch {
        // Fall back to local on any failure so the UI never blocks.
      }
    }
    const homes = readLocal()
    const index = homes.findIndex((candidate) => candidate.id === stamped.id)
    if (index >= 0) homes[index] = stamped
    else homes.unshift(stamped)
    writeLocal(homes)
    return stamped
  },

  async deleteHome(homeId: string, userId: string | null): Promise<void> {
    const supabase = getSupabase()
    if (supabase && userId) {
      try {
        const { error } = await supabase.from('green_homes').delete().eq('id', homeId)
        if (!error) {
          writeLocal(readLocal().filter((home) => home.id !== homeId))
          return
        }
      } catch {
        /* fall through to local delete */
      }
    }
    writeLocal(readLocal().filter((home) => home.id !== homeId))
  },

  createId: newId,
}
