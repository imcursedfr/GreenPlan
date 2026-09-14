import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface PageShellProps {
  className?: string
  children: ReactNode
}

/** Standard content column for app-area pages. */
export function PageShell({ className, children }: PageShellProps) {
  return <div className={cx('mx-auto w-full max-w-6xl', className)}>{children}</div>
}
