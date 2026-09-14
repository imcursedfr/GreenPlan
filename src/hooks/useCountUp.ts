import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * Animates a number from 0 to `target` for metric displays.
 * Falls back to the static value when reduced motion is preferred.
 */
export function useCountUp(target: number, duration = 0.9): number {
  const [display, setDisplay] = useState(() => target)
  const previousTarget = useRef(target)

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      setDisplay(target)
      return
    }
    const state = { value: previousTarget.current === target ? 0 : previousTarget.current }
    previousTarget.current = target
    const tween = gsap.to(state, {
      value: target,
      duration,
      ease: 'power2.out',
      onUpdate: () => setDisplay(state.value),
    })
    return () => {
      tween.kill()
    }
  }, [target, duration])

  return display
}
