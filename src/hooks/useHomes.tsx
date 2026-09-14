import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { homesService, readActiveHomeId, writeActiveHomeId, type HomeRecord } from '../services/homesService'
import type { PlannerProfile } from '../types/profile'
import { useAuth } from './useAuth'
import { useProfile } from './useProfile'

interface HomesContextValue {
  homes: HomeRecord[]
  activeHomeId: string | null
  /** True while the initial list is loading. */
  loading: boolean
  /** Create a home from a profile; becomes the active home. */
  createHome: (name: string, profile: PlannerProfile) => Promise<HomeRecord>
  /** Rename a home. */
  renameHome: (homeId: string, name: string) => Promise<void>
  /** Persist the (possibly edited) profile of a home. */
  updateHomeProfile: (homeId: string, profile: PlannerProfile) => Promise<void>
  /** Delete a home. If it was active, the next home becomes active. */
  deleteHome: (homeId: string) => Promise<void>
  /** Switch the active home; writes its profile into the ProfileProvider. */
  switchHome: (homeId: string) => Promise<void>
  /** Ensure the active home record reflects the current profile (after onboarding save). */
  syncActiveHomeFromProfile: (profile: PlannerProfile, name?: string) => Promise<void>
}

const HomesContext = createContext<HomesContextValue | null>(null)

/**
 * Multi-home manager.
 *
 * Invariant: exactly one profile is "live" in ProfileProvider at a time.
 * switchHome() atomically replaces it, so every consumer (dashboard,
 * modules, planner, AI insights) re-derives from the new home's data with
 * no stale values.
 */
export function HomesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { saveProfile } = useProfile()
  const [homes, setHomes] = useState<HomeRecord[]>([])
  const [activeHomeId, setActiveHomeId] = useState<string | null>(readActiveHomeId())
  const [loading, setLoading] = useState(true)

  const userId = user?.id ?? null

  const refresh = useCallback(async () => {
    setLoading(true)
    const list = await homesService.listHomes(userId)
    setHomes(list)
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const setActive = useCallback((id: string | null) => {
    setActiveHomeId(id)
    writeActiveHomeId(id)
  }, [])

  const createHome = useCallback(
    async (name: string, homeProfile: PlannerProfile) => {
      const now = new Date().toISOString()
      const record: HomeRecord = {
        id: homesService.createId(),
        name,
        profile: homeProfile,
        createdAt: now,
        updatedAt: now,
      }
      const saved = await homesService.upsertHome(record, userId)
      setHomes((previous) => [saved, ...previous.filter((home) => home.id !== saved.id)])
      setActive(saved.id)
      await saveProfile(homeProfile)
      return saved
    },
    [userId, setActive, saveProfile],
  )

  const renameHome = useCallback(
    async (homeId: string, name: string) => {
      const existing = homes.find((home) => home.id === homeId)
      if (!existing) return
      const saved = await homesService.upsertHome({ ...existing, name }, userId)
      setHomes((previous) => previous.map((home) => (home.id === saved.id ? saved : home)))
    },
    [homes, userId],
  )

  const updateHomeProfile = useCallback(
    async (homeId: string, homeProfile: PlannerProfile) => {
      const existing = homes.find((home) => home.id === homeId)
      if (!existing) return
      const saved = await homesService.upsertHome({ ...existing, profile: homeProfile }, userId)
      setHomes((previous) => previous.map((home) => (home.id === saved.id ? saved : home)))
      if (homeId === activeHomeId) await saveProfile(homeProfile)
    },
    [homes, userId, activeHomeId, saveProfile],
  )

  const deleteHome = useCallback(
    async (homeId: string) => {
      await homesService.deleteHome(homeId, userId)
      setHomes((previous) => {
        const next = previous.filter((home) => home.id !== homeId)
        if (homeId === activeHomeId) {
          const fallback = next[0]?.id ?? null
          setActive(fallback)
          if (fallback) {
            const fallbackHome = next.find((home) => home.id === fallback)
            if (fallbackHome) void saveProfile(fallbackHome.profile)
          }
        }
        return next
      })
    },
    [userId, activeHomeId, setActive, saveProfile],
  )

  const switchHome = useCallback(
    async (homeId: string) => {
      const target = homes.find((home) => home.id === homeId)
      if (!target) return
      setActive(homeId)
      await saveProfile(target.profile)
    },
    [homes, setActive, saveProfile],
  )

  /**
   * After onboarding saves a profile: attach it to the active home (or
   * create a home record if none exists yet). The profile is passed
   * explicitly — the context value may still be stale at call time.
   */
  const syncActiveHomeFromProfile = useCallback(
    async (savedProfile: PlannerProfile, name?: string) => {
      const active = homes.find((home) => home.id === activeHomeId)
      if (active) {
        const updated = { ...active, profile: savedProfile, updatedAt: new Date().toISOString() }
        await homesService.upsertHome(updated, userId)
        setHomes((previous) => previous.map((home) => (home.id === updated.id ? updated : home)))
      } else {
        const label =
          name ??
          savedProfile.home.locationLabel ??
          savedProfile.home.geocodedCity ??
          'My home'
        await createHome(label, savedProfile)
      }
    },
    [homes, activeHomeId, userId, createHome],
  )

  const value = useMemo(
    () => ({
      homes,
      activeHomeId,
      loading,
      createHome,
      renameHome,
      updateHomeProfile,
      deleteHome,
      switchHome,
      syncActiveHomeFromProfile,
    }),
    [homes, activeHomeId, loading, createHome, renameHome, updateHomeProfile, deleteHome, switchHome, syncActiveHomeFromProfile],
  )

  return <HomesContext.Provider value={value}>{children}</HomesContext.Provider>
}

export function useHomes(): HomesContextValue {
  const ctx = useContext(HomesContext)
  if (!ctx) throw new Error('useHomes must be used inside <HomesProvider>')
  return ctx
}
