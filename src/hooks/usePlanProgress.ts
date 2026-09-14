import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SavedPlan, SavedPlanAction, ActionStatus } from '../services/planService'

/**
 * Progress tracking for the planner.
 *
 * Status lives on the SavedPlan actions; guests persist to localStorage via
 * the plan service, signed-in users to Supabase. The hook itself is pure
 * state + callbacks so the planner stays declarative.
 */
export function usePlanProgress(
  plan: SavedPlan | null,
  onSave: (plan: SavedPlan) => Promise<void> | void,
) {
  const [actions, setActions] = useState<SavedPlanAction[]>(plan?.actions ?? [])

  useEffect(() => {
    setActions(plan?.actions ?? [])
  }, [plan?.id, plan?.updatedAt])

  const setStatus = useCallback(
    (recommendationId: string, status: ActionStatus) => {
      setActions((previous) => {
        const next = previous.map((action) =>
          action.recommendationId === recommendationId ? { ...action, status } : action,
        )
        if (plan) {
          void onSave({ ...plan, actions: next })
        }
        return next
      })
    },
    [plan, onSave],
  )

  const stats = useMemo(() => {
    const completed = actions.filter((action) => action.status === 'completed').length
    const inProgress = actions.filter((action) => action.status === 'in-progress').length
    const percent = actions.length > 0 ? Math.round((completed / actions.length) * 100) : 0
    const nextAction = actions.find((action) => action.status !== 'completed') ?? null
    return { completed, inProgress, remaining: actions.length - completed, percent, nextAction }
  }, [actions])

  return { actions, setStatus, stats }
}
