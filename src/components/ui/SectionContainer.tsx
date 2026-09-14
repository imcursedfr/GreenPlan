import type { ReactNode } from 'react'
import { cx } from '../../lib/cx'

interface SectionContainerProps {
  id?: string
  className?: string
  children: ReactNode
}

/** Consistent horizontal rhythm for landing/page sections. */
export function SectionContainer({ id, className, children }: SectionContainerProps) {
  return (
    <section id={id} className={cx('mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8', className)}>
      {children}
    </section>
  )
}
