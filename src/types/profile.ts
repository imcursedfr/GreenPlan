import type { EnergyProfile, HomeProfile, WaterProfile } from './index'

/**
 * The complete profile captured by onboarding and consumed by the
 * deterministic engines. Persisted locally (and to Supabase when configured)
 * by the ProfileProvider.
 */
export interface PlannerProfile {
  home: HomeProfile
  energy: EnergyProfile
  water: WaterProfile
  updatedAt: string
}
