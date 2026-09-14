import { useMemo } from 'react'
import { useProfile } from './useProfile'
import { assessProfile, buildRecommendations } from '../calculations'

/**
 * The minimum viable profile before any PERSONALIZED analysis may render:
 * home size + roof + energy usage. Without these the engines would either
 * run on fallback defaults (fabricated-feeling output) or fail — so module
 * pages show a clean empty state instead.
 */
export function isProfileComplete(profile: {
  home: { floorAreaSqm?: number; roofAreaSqm?: number }
  energy: { monthlyElectricityKwh?: number; monthlyBillAmount?: number }
}): boolean {
  const hasArea = (profile.home.floorAreaSqm ?? 0) > 0
  const hasRoof = (profile.home.roofAreaSqm ?? 0) > 0
  const hasEnergy =
    (profile.energy.monthlyElectricityKwh ?? 0) > 0 || (profile.energy.monthlyBillAmount ?? 0) > 0
  return hasArea && hasRoof && hasEnergy
}

/**
 * Runs the deterministic engines against the active profile.
 * Returns null until onboarding has produced a sufficiently complete profile.
 */
export function useAssessment() {
  const { profile } = useProfile()

  return useMemo(() => {
    if (!profile) return null
    if (!isProfileComplete(profile)) return null
    const bundle = assessProfile(profile)
    const recommendations = buildRecommendations(profile, bundle)
    return { profile, bundle, recommendations }
  }, [profile])
}
