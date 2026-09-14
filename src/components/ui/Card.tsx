import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { chipTones, type AccentTone } from '../../lib/accents'
import type { LucideIcon } from 'lucide-react'

interface CardProps {
  /** Adds a subtle lift-on-hover transition. */
  hover?: boolean
  className?: string
  children: ReactNode
}

export function Card({ hover = false, className, children }: CardProps) {
  return (
    <div
      className={cx(
        'rounded-2xl border border-border-base bg-surface-card shadow-card',
        hover &&
          'transition duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover',
        className,
      )}
    >
      {children}
    </div>
  )
}

interface CardHeaderProps {
  icon?: LucideIcon
  tone?: AccentTone
  title: string
  description?: string
  /** Right-aligned slot (badges, links, actions). */
  action?: ReactNode
  className?: string
}

export function CardHeader({ icon: Icon, tone = 'neutral', title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cx('flex items-start justify-between gap-4 px-5 pt-5', className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className={cx('flex size-9 shrink-0 items-center justify-center rounded-lg', chipTones[tone])}>
            <Icon className="size-4.5" aria-hidden />
          </span>
        )}
        <div>
          <h3 className="font-semibold text-text-strong">{title}</h3>
          {description && <p className="mt-0.5 text-sm text-text-muted">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function CardContent({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('px-5 pb-5 pt-4', className)}>{children}</div>
}
