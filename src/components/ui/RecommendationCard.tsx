import type { LucideIcon } from 'lucide-react'
import { Banknote, Clock, Coins, Droplets, Fan, Leaf, Recycle, Sun } from 'lucide-react'
import { cx } from '../../lib/cx'
import { chipTones, type AccentTone } from '../../lib/accents'
import { Badge } from './Badge'
import { Card } from './Card'
import { formatCurrency, formatNumber } from '../../lib/format'
import type { Recommendation, RecommendationCategory, RecommendationPriority } from '../../types'

const categoryMeta: Record<RecommendationCategory, { icon: LucideIcon; tone: AccentTone; label: string }> = {
  solar: { icon: Sun, tone: 'solar', label: 'Solar' },
  water: { icon: Droplets, tone: 'aqua', label: 'Water' },
  efficiency: { icon: Fan, tone: 'skye', label: 'Efficiency' },
  waste: { icon: Recycle, tone: 'lime', label: 'Waste' },
}

const priorityTone: Record<RecommendationPriority, AccentTone> = {
  high: 'solar',
  medium: 'skye',
  low: 'neutral',
}

const priorityLabel: Record<RecommendationPriority, string> = {
  high: 'High priority',
  medium: 'Medium',
  low: 'Low',
}

interface RecommendationCardProps {
  recommendation: Recommendation
  className?: string
}

/**
 * Renders a single recommendation. Impact figures are shown only when the
 * recommendation carries them (traceably derived from deterministic results).
 */
export function RecommendationCard({ recommendation, className }: RecommendationCardProps) {
  const { icon: CategoryIcon, tone, label } = categoryMeta[recommendation.category]
  const impact = recommendation.impact

  return (
    <Card hover className={cx('flex h-full flex-col p-5', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className={cx('flex size-9 items-center justify-center rounded-lg', chipTones[tone])}>
          <CategoryIcon className="size-4.5" aria-hidden />
        </span>
        <div className="flex items-center gap-2">
          <Badge tone={tone}>{label}</Badge>
          <Badge tone={priorityTone[recommendation.priority]}>{priorityLabel[recommendation.priority]}</Badge>
        </div>
      </div>

      <h3 className="mt-4 font-semibold text-text-strong">{recommendation.title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-text-muted">{recommendation.rationale}</p>

      {(impact || recommendation.estimatedCost !== undefined) && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-border-base pt-3.5 text-xs text-text-body">
          {recommendation.estimatedCost !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <Banknote className="size-3.5 text-text-faint" aria-hidden />
              {formatCurrency(recommendation.estimatedCost, recommendation.currency)}
            </span>
          )}
          {impact?.annualSavings !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <Coins className="size-3.5 text-brand" aria-hidden />
              {formatCurrency(impact.annualSavings, recommendation.currency)}/yr
            </span>
          )}
          {impact?.paybackYears !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5 text-text-faint" aria-hidden />
              {formatNumber(impact.paybackYears, 1)} yr payback
            </span>
          )}
          {impact?.annualCo2AvoidedKg !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <Leaf className="size-3.5 text-brand" aria-hidden />
              {formatNumber(impact.annualCo2AvoidedKg, 0)} kg CO₂/yr
            </span>
          )}
          {impact?.annualWaterSavedLiters !== undefined && (
            <span className="inline-flex items-center gap-1.5">
              <Droplets className="size-3.5 text-aqua" aria-hidden />
              {formatNumber(impact.annualWaterSavedLiters, 0)} L water/yr
            </span>
          )}
        </div>
      )}
    </Card>
  )
}
