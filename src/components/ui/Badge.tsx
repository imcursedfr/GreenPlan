import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'
import { badgeTones, type AccentTone } from '../../lib/accents'

interface BadgeProps {
  tone?: AccentTone
  className?: string
  children: ReactNode
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
