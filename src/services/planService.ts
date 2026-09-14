import type { PlannerProfile } from '../types/profile'
import type { Recommendation, SustainabilityScore } from '../types'
import { getSupabase } from './supabaseClient'

/**
 * Saved GreenPlans.
 *
 * A plan is a lightweight snapshot: profile reference, module results,
 * recommendation titles with progress, and the comparison mode in use.
 * Persisted to Supabase when configured; otherwise localStorage so guests
 * can still track progress locally.
 */

export type ActionStatus = 'not-started' | 'in-progress' | 'completed'

export interface SavedPlanAction {
  recommendationId: string
  title: string
  status: ActionStatus
}

export interface SavedPlan {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  /** Home profile at save time. */
  profile: PlannerProfile
  /** Deterministic score snapshot for the plan card. */
  score: SustainabilityScore
  /** Recommendation titles (numbers are always recomputed live). */
  actions: SavedPlanAction[]
  compareMode: string
  /** Totals snapshot for card display. */
  totals: {
    investment: number
    annualSavings: number
    annualCo2AvoidedKg: number
  }
}

const LOCAL_KEY = 'shp.plans.v1'

function readLocalPlans(): SavedPlan[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? (JSON.parse(raw) as SavedPlan[]) : []
  } catch {
    return []
  }
}

function writeLocalPlans(plans: SavedPlan[]): void {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(plans))
  } catch {
    /* ignore */
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export const planService = {
  /** List plans: Supabase when configured + signed in, else local. */
  async listPlans(userId: string | null): Promise<SavedPlan[]> {
    const supabase = getSupabase()
    if (supabase && userId) {
      try {
        const { data, error } = await supabase
          .from('green_plans')
          .select('plan')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false })
        if (error) throw error
        return (data ?? []).map((row: { plan: SavedPlan }) => row.plan)
      } catch {
        // Supabase unreachable: fall through to local plans.
      }
    }
    return readLocalPlans().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  /** Upsert a plan. Falls back to local storage for guests. */
  async savePlan(plan: SavedPlan, userId: string | null): Promise<SavedPlan> {
    const stamped: SavedPlan = { ...plan, updatedAt: new Date().toISOString() }
    const supabase = getSupabase()
    if (supabase && userId) {
      const { error } = await supabase
        .from('green_plans')
        .upsert({ id: stamped.id, user_id: userId, plan: stamped, updated_at: stamped.updatedAt })
      if (error) throw error
      return stamped
    }
    const plans = readLocalPlans()
    const index = plans.findIndex((candidate) => candidate.id === stamped.id)
    if (index >= 0) plans[index] = stamped
    else plans.unshift(stamped)
    writeLocalPlans(plans)
    return stamped
  },

  async deletePlan(planId: string, userId: string | null): Promise<void> {
    const supabase = getSupabase()
    if (supabase && userId) {
      const { error } = await supabase.from('green_plans').delete().eq('id', planId)
      if (error) throw error
      return
    }
    writeLocalPlans(readLocalPlans().filter((plan) => plan.id !== planId))
  },

  createId: newId,
}

/** Build a plan snapshot from the live assessment. */
export function buildPlanSnapshot(input: {
  name: string
  profile: PlannerProfile
  score: SustainabilityScore
  recommendations: Recommendation[]
  compareMode: string
  existingPlan?: SavedPlan
}): SavedPlan {
  const now = new Date().toISOString()
  return {
    id: input.existingPlan?.id ?? newId(),
    name: input.name,
    createdAt: input.existingPlan?.createdAt ?? now,
    updatedAt: now,
    profile: input.profile,
    score: input.score,
    compareMode: input.compareMode,
    actions: input.recommendations.map((rec) => {
      const previous = input.existingPlan?.actions.find((action) => action.recommendationId === rec.id)
      return {
        recommendationId: rec.id,
        title: rec.title,
        status: previous?.status ?? 'not-started',
      }
    }),
    totals: {
      investment: input.recommendations.reduce((sum, rec) => sum + (rec.estimatedCost ?? 0), 0),
      annualSavings: input.recommendations.reduce((sum, rec) => sum + (rec.impact?.annualSavings ?? 0), 0),
      annualCo2AvoidedKg: input.recommendations.reduce((sum, rec) => sum + (rec.impact?.annualCo2AvoidedKg ?? 0), 0),
    },
  }
}
