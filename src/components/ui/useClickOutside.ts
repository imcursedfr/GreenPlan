import { useEffect, useRef } from 'react'

/**
 * Close-on-outside-click helper used by popovers (theme menu).
 * Attaches pointerdown + Escape listeners only while active.
 */
export function useClickOutside<T extends HTMLElement>(
  onOutside: () => void,
  active: boolean,
) {
  const ref = useRef<T>(null)
  const callbackRef = useRef(onOutside)
  callbackRef.current = onOutside

  useEffect(() => {
    if (!active) return
    const handlePointer = (event: PointerEvent) => {
      const el = ref.current
      if (el && !el.contains(event.target as Node)) callbackRef.current()
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') callbackRef.current()
    }
    window.addEventListener('pointerdown', handlePointer)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('pointerdown', handlePointer)
      window.removeEventListener('keydown', handleKey)
    }
  }, [active])

  return ref
}
