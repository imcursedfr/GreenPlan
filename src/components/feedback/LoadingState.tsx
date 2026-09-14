import { Loader2, Leaf } from 'lucide-react'
import { cx } from '../../lib/cx'

interface LoadingStateProps {
  message?: string
  className?: string
}

/** Inline loading indicator for panels and sections. */
export function LoadingState({ message = 'Loading…', className }: LoadingStateProps) {
  return (
    <div className={cx('flex items-center justify-center gap-2.5 py-10 text-sm text-text-muted', className)}>
      <Loader2 className="size-4 animate-spin text-brand" aria-hidden />
      <span>{message}</span>
    </div>
  )
}

/** Suspense fallback for lazy routes. */
export function RouteFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-3">
        <span className="flex size-12 animate-pulse items-center justify-center rounded-2xl bg-brand-soft text-brand">
          <Leaf className="size-6" aria-hidden />
        </span>
        <p className="text-sm text-text-muted">Loading your plan…</p>
      </div>
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('block animate-pulse rounded-lg bg-surface-muted', className)} />
}
