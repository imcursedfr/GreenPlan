import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cx } from '../../lib/cx'
import { chipTones, type AccentTone } from '../../lib/accents'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  tone?: AccentTone
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, tone = 'neutral', action, className }: EmptyStateProps) {
  return (
    <div
      className={cx(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-strong bg-surface-muted/50 px-6 py-14 text-center',
        className,
      )}
    >
      <span className={cx('flex size-12 items-center justify-center rounded-xl', chipTones[tone])}>
        <Icon className="size-6" aria-hidden />
      </span>
      <h3 className="mt-4 text-base font-semibold text-text-strong">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm leading-relaxed text-text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
