import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Bookmark,
  CalendarClock,
  Check,
  Coins,
  Gauge,
  Leaf,
  ListOrdered,
  Loader2,
  Play,
  Route as RouteIcon,
  Sparkles,
  Trees,
} from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { PageHeader } from '../components/ui/PageHeader'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/feedback/EmptyState'
import { AiInsightCard, useAiInsight } from '../components/ai/AiInsightCard'
import { useAssessment } from '../hooks/useAssessment'
import { useProfile } from '../hooks/useProfile'
import { useAuth } from '../hooks/useAuth'
import { usePlanProgress } from '../hooks/usePlanProgress'
import { useGsapReveal } from '../hooks/useGsapReveal'
import { formatCurrency, formatNumber } from '../lib/format'
import {
  plannerInsight,
  fallbackPlannerInsight,
  buildHomeSummary,
  buildCalculationFacts,
} from '../ai/insights'
import { buildPlanSnapshot, planService, type SavedPlan } from '../services/planService'
import type { ActionStatus } from '../services/planService'
import type { Recommendation } from '../types'
import { cx } from '../lib/cx'

type CompareMode = 'roadmap' | 'lowest-cost' | 'fastest-payback' | 'highest-impact' | 'best-value'

const compareModes: Array<{ id: CompareMode; label: string; description: string }> = [
  { id: 'roadmap', label: 'Suggested order', description: 'Phased by budget fit and priority.' },
  { id: 'lowest-cost', label: 'Lowest cost', description: 'Cheapest actions first.' },
  { id: 'fastest-payback', label: 'Fastest payback', description: 'Quickest money-back first.' },
  { id: 'highest-impact', label: 'Highest impact', description: 'Max CO₂ / resource reduction first.' },
  { id: 'best-value', label: 'Best overall value', description: 'Savings per dollar invested.' },
]

const LOCAL_PLAN_KEY = 'shp.activePlan.v1'

function readLocalPlan(): SavedPlan | null {
  try {
    const raw = localStorage.getItem(LOCAL_PLAN_KEY)
    return raw ? (JSON.parse(raw) as SavedPlan) : null
  } catch {
    return null
  }
}

/** /planner — AI-explained, trackable roadmap over deterministic results. */
export default function PlannerPage() {
  const assessment = useAssessment()
  const { profile } = useProfile()
  const { user } = useAuth()
  const reveal = useGsapReveal<HTMLElement>({ selector: '[data-reveal]', y: 18, stagger: 0.06 })
  const [mode, setMode] = useState<CompareMode>('roadmap')
  const [savedPlan, setSavedPlan] = useState<SavedPlan | null>(() => readLocalPlan())
  const [savingPlan, setSavingPlan] = useState(false)
  const [planSavedAt, setPlanSavedAt] = useState<string | null>(null)

  const currency = profile?.energy.currency ?? 'USD'
  const budget = profile?.home.sustainabilityBudget

  // ── Ordering per comparison mode (deterministic, unchanged) ───────────────
  const ordered = useMemo(() => {
    if (!assessment) return []
    const recs = [...assessment.recommendations]
    switch (mode) {
      case 'lowest-cost':
        return recs.sort((a, b) => (a.estimatedCost ?? 0) - (b.estimatedCost ?? 0))
      case 'fastest-payback':
        return recs.sort(
          (a, b) => (a.impact?.paybackYears ?? Infinity) - (b.impact?.paybackYears ?? Infinity),
        )
      case 'highest-impact':
        return recs.sort(
          (a, b) =>
            (b.impact?.annualCo2AvoidedKg ?? 0) + (b.impact?.annualWaterSavedLiters ?? 0) / 1000 -
            ((a.impact?.annualCo2AvoidedKg ?? 0) + (a.impact?.annualWaterSavedLiters ?? 0) / 1000),
        )
      case 'best-value':
        return recs.sort(
          (a, b) =>
            (b.impact?.annualSavings ?? 0) / Math.max(b.estimatedCost ?? 1, 1) -
            (a.impact?.annualSavings ?? 0) / Math.max(a.estimatedCost ?? 1, 1),
        )
      case 'roadmap':
      default: {
        const phase1Budget = budget ?? 6000
        const quickWins = recs
          .filter((rec) => rec.priority === 'high' && (rec.estimatedCost ?? 0) <= phase1Budget)
          .sort((a, b) => (a.estimatedCost ?? 0) - (b.estimatedCost ?? 0))
        const core = recs
          .filter((rec) => !quickWins.includes(rec) && (rec.estimatedCost ?? 0) > phase1Budget)
          .sort((a, b) => valueScore(b) - valueScore(a))
        const rest = recs.filter((rec) => !quickWins.includes(rec) && !core.includes(rec))
        return [...quickWins, ...core, ...rest]
      }
    }
  }, [assessment, mode, budget])

  // ── AI planner insight (structured, validated, via runAiTask funnel) ──────
  const ai = useAiInsight(
    () => {
      if (!assessment) {
        return Promise.resolve({ data: null, requestId: 'no-profile', durationMs: 0 })
      }
      const titles = ordered.map((rec) => rec.title)
      return plannerInsight(
        {
          homeSummary: buildHomeSummary(assessment.profile),
          calculationFacts: buildCalculationFacts(assessment.bundle),
          recommendationTitles: titles,
        },
        { surface: 'planner-page' },
      )
    },
    assessment ? [assessment.profile.updatedAt] : ['none'],
  )

  // ── Progress persistence ──────────────────────────────────────────────────
  const savePlan = async (plan: SavedPlan) => {
    try {
      const saved = await planService.savePlan(plan, user?.id ?? null)
      setSavedPlan(saved)
      setPlanSavedAt(saved.updatedAt)
      if (!user) {
        try {
          localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(saved))
        } catch {
          /* ignore */
        }
      }
    } catch (error) {
      console.error('[planner] saving plan failed', error)
    }
  }

  const progress = usePlanProgress(savedPlan, savePlan)

  const saveSnapshot = async () => {
    if (!assessment) return
    setSavingPlan(true)
    try {
      const snapshot = buildPlanSnapshot({
        name: profile?.home.locationLabel ? `GreenPlan — ${profile.home.locationLabel}` : 'GreenPlan — My home',
        profile: assessment.profile,
        score: assessment.bundle.score,
        recommendations: assessment.recommendations,
        compareMode: mode,
        existingPlan: savedPlan && savedPlan.actions.length === assessment.recommendations.length ? savedPlan : undefined,
      })
      await savePlan(snapshot)
    } finally {
      setSavingPlan(false)
    }
  }

  // Keep the local plan's action list aligned with current recommendations.
  useEffect(() => {
    if (!assessment) return
    const current = savedPlan
    const ids = assessment.recommendations.map((rec) => rec.id)
    const aligned =
      current &&
      current.actions.length === ids.length &&
      current.actions.every((action) => ids.includes(action.recommendationId))
    if (!aligned) {
      // Build a tracking copy without overwriting any saved plan yet.
      const draft = buildPlanSnapshot({
        name: profile?.home.locationLabel ? `GreenPlan — ${profile.home.locationLabel}` : 'GreenPlan — My home',
        profile: assessment.profile,
        score: assessment.bundle.score,
        recommendations: assessment.recommendations,
        compareMode: mode,
        existingPlan: current ?? undefined,
      })
      setSavedPlan(draft)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment?.profile.updatedAt])

  if (!assessment) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Planner"
          eyebrowIcon={RouteIcon}
          title="Your GreenPlan roadmap"
          description="Tell us about your home to generate a phased, prioritized plan — no account needed."
        />
        <EmptyState
          icon={RouteIcon}
          title="No plan yet"
          description="The planner ranks your deterministic module results into an actionable roadmap. Run the two-minute setup first."
          action={
            <Button to="/onboarding" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
              Build My Home Profile
            </Button>
          }
        />
      </PageShell>
    )
  }

  const { bundle, recommendations } = assessment
  const totalCost = recommendations.reduce((sum, rec) => sum + (rec.estimatedCost ?? 0), 0)
  const totalSavings = recommendations.reduce((sum, rec) => sum + (rec.impact?.annualSavings ?? 0), 0)
  const totalCo2 = recommendations.reduce((sum, rec) => sum + (rec.impact?.annualCo2AvoidedKg ?? 0), 0)

  return (
    <PageShell>
      <article ref={reveal}>
        <PageHeader
          eyebrow="Planner"
          eyebrowIcon={RouteIcon}
          title="Your GreenPlan roadmap"
          description={
            bundle.score.summary ??
            'Every recommendation below is derived from deterministic module results.'
          }
          actions={
            <>
              <Button
                variant="secondary"
                loading={savingPlan}
                leftIcon={<Bookmark className="size-4" aria-hidden />}
                onClick={() => void saveSnapshot()}
              >
                {planSavedAt ? 'Plan saved' : 'Save my GreenPlan'}
              </Button>
              <Button to="/onboarding" variant="ghost">
                Edit profile
              </Button>
            </>
          }
        />

        {/* Progress tracker */}
        <Card className="mb-6 p-5" data-reveal>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-text-muted">Your GreenPlan</p>
              <p className="mt-0.5 font-display text-2xl font-bold text-text-strong">
                {progress.stats.percent}%
                <span className="ml-2 text-sm font-semibold text-text-faint">
                  {progress.stats.completed}/{progress.actions.length} actions completed
                </span>
              </p>
            </div>
            {progress.stats.nextAction && (
              <div className="rounded-xl bg-brand-softer px-4 py-2.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-brand-text">Next recommended action</p>
                <p className="mt-0.5 text-sm font-semibold text-text-strong">{progress.stats.nextAction.title}</p>
              </div>
            )}
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full rounded-full bg-brand transition-all duration-700"
              style={{ width: `${progress.stats.percent}%` }}
              role="progressbar"
              aria-valuenow={progress.stats.percent}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
          <p className="mt-2 text-xs text-text-faint">
            {user ? 'Progress saves to your account.' : 'Progress is saved in this browser — create an account to keep it across devices.'}
          </p>
        </Card>

        {/* Plan totals */}
        <div className="grid gap-4 sm:grid-cols-3" data-reveal>
          <Card className="p-5">
            <p className="text-sm font-medium text-text-muted">Full plan investment</p>
            <p className="mt-1 font-display text-2xl font-bold text-text-strong">
              {formatCurrency(totalCost, currency)}
            </p>
            {budget !== undefined && (
              <p className="mt-1 text-xs text-text-faint">Your stated budget: {formatCurrency(budget, currency)}</p>
            )}
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium text-text-muted">Annual savings when complete</p>
            <p className="mt-1 font-display text-2xl font-bold text-brand">
              {formatCurrency(totalSavings, currency)}
            </p>
            <p className="mt-1 text-xs text-text-faint">
              Simple plan payback: {totalSavings > 0 ? `${formatNumber(totalCost / totalSavings, 1)} yr` : '—'}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium text-text-muted">Annual CO₂ avoided</p>
            <p className="mt-1 font-display text-2xl font-bold text-brand">{formatNumber(totalCo2, 0)} kg</p>
            <p className="mt-1 text-xs text-text-faint">{recommendations.length} recommendations</p>
          </Card>
        </div>

        {/* Comparison modes */}
        <div className="mt-8" data-reveal>
          <div className="flex flex-wrap items-center gap-2">
            <ListOrdered className="size-4 text-text-muted" aria-hidden />
            <span className="text-sm font-medium text-text-body">Compare by:</span>
            {compareModes.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setMode(option.id)}
                title={option.description}
                className={cx(
                  'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all',
                  mode === option.id
                    ? 'bg-brand text-brand-contrast shadow-sm'
                    : 'bg-surface-muted text-text-muted hover:bg-surface-hover hover:text-text-strong',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI planner insight */}
        <AiInsightCard
          className="mt-6"
          title="GreenPlan AI — your roadmap, explained"
          context="Roadmap"
          insight={ai.loading ? null : ai.unavailable ? undefined : ai.data}
          fallback={fallbackPlannerInsight(ordered.map((rec) => rec.title))}
        />

        {/* Ordered roadmap with progress controls */}
        <div className="mt-6 space-y-4" data-reveal>
          {ordered.map((rec, index) => {
            const action = progress.actions.find((item) => item.recommendationId === rec.id)
            return (
              <RoadmapItem
                key={rec.id}
                rec={rec}
                order={index + 1}
                phase={
                  mode === 'roadmap'
                    ? (rec.estimatedCost ?? 0) <= (budget ?? 6000) && rec.priority === 'high'
                      ? 'Phase 1 · Quick win'
                      : (rec.estimatedCost ?? 0) > (budget ?? 6000)
                        ? 'Phase 2 · Core investment'
                        : 'Phase 3 · Next up'
                    : undefined
                }
                currency={currency}
                status={action?.status ?? 'not-started'}
                onStatus={(status) => progress.setStatus(rec.id, status)}
              />
            )
          })}
          {ordered.length === 0 && (
            <EmptyState
              icon={Leaf}
              title="No recommendations yet"
              description="Add more profile details — roof area, usage, household size — to unlock recommendations."
            />
          )}
        </div>
      </article>
    </PageShell>
  )
}

function RoadmapItem({
  rec,
  order,
  phase,
  currency,
  status,
  onStatus,
}: {
  rec: Recommendation
  order: number
  phase?: string
  currency: string
  status: ActionStatus
  onStatus: (status: ActionStatus) => void
}) {
  const completed = status === 'completed'
  const inProgress = status === 'in-progress'

  return (
    <Card hover className={cx('p-5 transition-opacity', completed && 'opacity-80')}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex items-center gap-3">
          <span
            className={cx(
              'flex size-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold',
              completed ? 'bg-brand text-brand-contrast' : 'bg-brand-soft text-brand-text',
            )}
          >
            {completed ? <Check className="size-4" aria-hidden /> : order}
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={cx('font-semibold text-text-strong', completed && 'line-through decoration-brand/50')}>
              {rec.title}
            </h3>
            <Badge tone={rec.priority === 'high' ? 'solar' : rec.priority === 'medium' ? 'skye' : 'neutral'}>
              {rec.priority} priority
            </Badge>
            {phase && <Badge tone="brand">{phase}</Badge>}
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{rec.rationale}</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-text-body">
            {rec.estimatedCost !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <Coins className="size-3.5 text-text-faint" aria-hidden />
                {formatCurrency(rec.estimatedCost, currency)}
              </span>
            )}
            {rec.impact?.annualSavings !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarClock className="size-3.5 text-brand" aria-hidden />
                {formatCurrency(rec.impact.annualSavings, currency)}/yr
              </span>
            )}
            {rec.impact?.paybackYears !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <Gauge className="size-3.5 text-text-faint" aria-hidden />
                {formatNumber(rec.impact.paybackYears, 1)} yr payback
              </span>
            )}
            {rec.impact?.annualCo2AvoidedKg !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <Trees className="size-3.5 text-brand" aria-hidden />
                {formatNumber(rec.impact.annualCo2AvoidedKg, 0)} kg CO₂/yr
              </span>
            )}
            {rec.impact?.annualWaterSavedLiters !== undefined && (
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-aqua" aria-hidden />
                {formatNumber(rec.impact.annualWaterSavedLiters, 0)} L water/yr
              </span>
            )}
          </div>
        </div>

        {/* Status control */}
        <div className="flex shrink-0 gap-1.5 rounded-xl bg-surface-muted p-1">
          {(
            [
              { id: 'not-started', label: 'To do', icon: null },
              { id: 'in-progress', label: 'Doing', icon: Loader2 },
              { id: 'completed', label: 'Done', icon: Check },
            ] as Array<{ id: ActionStatus; label: string; icon: React.ComponentType<{ className?: string }> | null }>
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onStatus(option.id)}
              aria-pressed={status === option.id}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all',
                status === option.id
                  ? 'bg-brand text-brand-contrast shadow-sm'
                  : 'text-text-muted hover:text-text-strong',
              )}
            >
              {option.icon && <option.icon className="size-3.5" aria-hidden />}
              {option.label}
            </button>
          ))}
          {inProgress && status === 'in-progress' && (
            <Play className="hidden" aria-hidden />
          )}
        </div>
      </div>
    </Card>
  )
}

/** Savings-per-dollar heuristic used by the roadmap phasing. */
function valueScore(rec: Recommendation): number {
  return (rec.impact?.annualSavings ?? 0) / Math.max(rec.estimatedCost ?? 1, 1)
}
