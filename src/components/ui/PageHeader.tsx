import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from './Badge'
import type { AccentTone } from '../../lib/accents'

interface PageHeaderProps {
  eyebrow?: string
  eyebrowIcon?: LucideIcon
  tone?: AccentTone
  title: string
  description?: string
  /** Right-aligned actions, e.g. primary buttons. */
  actions?: ReactNode
}

export function PageHeader({ eyebrow, eyebrowIcon: Icon, tone = 'brand', title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <Badge tone={tone} className="mb-3">
            {Icon && <Icon className="size-3.5" aria-hidden />}
            {eyebrow}
          </Badge>
        )}
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-strong">{title}</h1>
        {description && <p className="mt-2 text-base leading-relaxed text-text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  )
}
