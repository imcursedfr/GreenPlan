import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { ArrowRight } from 'lucide-react'
import { cx } from '../../lib/cx'
import { chipTones, type AccentTone } from '../../lib/accents'
import { Badge } from './Badge'

interface DashboardCardProps {
  title: string
  description?: string
  icon: LucideIcon
  tone?: AccentTone
  /** Makes the whole card a link to this route. */
  to?: string
  badge?: string
  className?: string
  children?: ReactNode
}

export function DashboardCard({ title, description, icon: Icon, tone = 'brand', to, badge, className, children }: DashboardCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className={cx('flex size-10 items-center justify-center rounded-xl', chipTones[tone])}>
          <Icon className="size-5" aria-hidden />
        </span>
        {badge && <Badge tone={tone}>{badge}</Badge>}
      </div>
      <h3 className="mt-4 flex items-center gap-1.5 font-semibold text-text-strong">
        {title}
        {to && (
          <ArrowRight
            className="size-4 text-text-faint transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-brand"
            aria-hidden
          />
        )}
      </h3>
      {description && <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{description}</p>}
      {children}
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className={cx(
          'group block rounded-2xl border border-border-base bg-surface-card p-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-card-hover',
          className,
        )}
      >
        {body}
      </Link>
    )
  }

  return <div className={cx('rounded-2xl border border-border-base bg-surface-card p-5 shadow-card', className)}>{body}</div>
}
