import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PlannerProfile } from '../types/profile'
import { isSupabaseConfigured, profileService } from '../services/profileService'

const LOCAL_KEY = 'shp.profile.v1'

interface ProfileContextValue {
  profile: PlannerProfile | null
  saving: boolean
  lastSavedAt: string | null
  /** Where the last save went — surfaced in the UI for transparency. */
  persistenceMode: 'supabase' | 'local' | null
  saveProfile: (profile: PlannerProfile) => Promise<void>
  clearProfile: () => void
  supabaseConfigured: boolean
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

function readLocal(): PlannerProfile | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as PlannerProfile) : null
  } catch {
    return null
  }
}

function writeLocal(profile: PlannerProfile | null): void {
  try {
    if (profile) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(profile))
    } else {
      localStorage.removeItem(LOCAL_KEY)
    }
  } catch {
    /* ignore */
  }
}

/**
 * Holds the active PlannerProfile for the whole app.
 *
 * Persistence strategy: save through profileService (Supabase) when
 * credentials exist; ALWAYS mirror to localStorage so the app stays fully
 * functional in demo mode without any backend.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PlannerProfile | null>(() => readLocal())
  const [saving, setSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [persistenceMode, setPersistenceMode] = useState<'supabase' | 'local' | null>(null)

  // In case another tab saves, keep this tab in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_KEY) setProfile(readLocal())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const saveProfile = useCallback(async (next: PlannerProfile) => {
    setSaving(true)
    writeLocal(next)
    setProfile(next)
    if (isSupabaseConfigured()) {
      try {
        await profileService.saveProfile(next)
        setPersistenceMode('supabase')
        setLastSavedAt(new Date().toISOString())
      } catch (error) {
        console.error('[profile] Supabase save failed; kept local copy.', error)
        setPersistenceMode('local')
        setLastSavedAt(new Date().toISOString())
      } finally {
        setSaving(false)
      }
    } else {
      // Demo mode — local persistence only.
      setPersistenceMode('local')
      setLastSavedAt(new Date().toISOString())
      setSaving(false)
    }
  }, [])

  const clearProfile = useCallback(() => {
    writeLocal(null)
    setProfile(null)
    setLastSavedAt(null)
    setPersistenceMode(null)
  }, [])

  const value = useMemo(
    () => ({
      profile,
      saving,
      lastSavedAt,
      persistenceMode,
      saveProfile,
      clearProfile,
      supabaseConfigured: isSupabaseConfigured(),
    }),
    [profile, saving, lastSavedAt, persistenceMode, saveProfile, clearProfile],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used inside <ProfileProvider>')
  return ctx
}
