import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface RevealOptions {
  /** CSS selector, scoped to the returned element, for staggered children. */
  selector?: string
  y?: number
  duration?: number
  stagger?: number
}

/**
 * Tasteful one-shot entrance animation via GSAP.
 *
 * - No-ops when the user prefers reduced motion.
 * - Cleans up after itself (gsap.context + revert) so React StrictMode's
 *   double-mount in development does not leave stray tweens behind.
 */
export function useGsapReveal<T extends HTMLElement = HTMLDivElement>(options?: RevealOptions) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const targets = options?.selector ? el.querySelectorAll(options.selector) : [el]
    if (targets.length === 0) return

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        y: options?.y ?? 24,
        opacity: 0,
        duration: options?.duration ?? 0.7,
        stagger: options?.stagger ?? 0.08,
        ease: 'power3.out',
        clearProps: 'transform,opacity',
      })
    }, el)

    return () => ctx.revert()
    // Options are read once on mount — callers pass static literals.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return ref
}
