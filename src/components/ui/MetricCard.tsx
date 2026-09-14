import type { LucideIcon } from 'lucide-react'
import { cx } from '../../lib/cx'
import { chipTones, type AccentTone } from '../../lib/accents'
import { Card } from './Card'

interface MetricCardProps {
  label: string
  /** Pre-formatted value — formatting happens at the call site. */
  value: string
  sub?: string
  icon: LucideIcon
  tone?: AccentTone
  loading?: boolean
  className?: string
}

export function MetricCard({ label, value, sub, icon: Icon, tone = 'brand', loading = false, className }: MetricCardProps) {
  return (
    <Card className={cx('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-muted">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded-lg bg-surface-muted" />
          ) : (
            <p className="mt-1 font-display text-2xl font-bold tracking-tight text-text-strong">{value}</p>
          )}
          {sub && !loading && <p className="mt-1 text-xs text-text-faint">{sub}</p>}
        </div>
        <span className={cx('flex size-9 shrink-0 items-center justify-center rounded-lg', chipTones[tone])}>
          <Icon className="size-4.5" aria-hidden />
        </span>
      </div>
    </Card>
  )
}
