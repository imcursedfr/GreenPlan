import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { themes, defaultTheme, isDarkTheme, type ThemeId } from './themes'

const STORAGE_KEY = 'shp.theme'

interface ThemeContextValue {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
  /** Resolved dark/light, including the OS preference for 'system'. */
  isDark: boolean
  /** Read a themed CSS variable value, e.g. getToken('--chart-1'). */
  getToken: (name: string) => string
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readStoredTheme(): ThemeId {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value && themes.some((t) => t.id === value)) return value as ThemeId
  } catch {
    /* storage unavailable (private mode) */
  }
  return defaultTheme
}

/**
 * Global theme provider.
 *
 * - Persists the selection (localStorage key `shp.theme`).
 * - Reflects it on <html data-theme="…"> so token overrides in index.css apply.
 * - 'system' follows the OS color-scheme live.
 * - Color cross-fade comes from the global token transition in CSS; GSAP adds
 *   a soft glow pulse on top. Both respect prefers-reduced-motion.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => readStoredTheme())
  const [isDark, setIsDark] = useState(() => isDarkTheme(readStoredTheme()))
  const root = typeof document !== 'undefined' ? document.documentElement : null

  // Reflect the theme so CSS variable overrides apply app-wide.
  useEffect(() => {
    if (!root) return
    root.setAttribute('data-theme', theme)
    if (theme === 'system') {
      root.removeAttribute('data-theme-locked')
    } else {
      root.setAttribute('data-theme-locked', 'true')
    }
    setIsDark(isDarkTheme(theme))
  }, [theme, root])

  // 'system' tracks OS changes live.
  useEffect(() => {
    if (theme !== 'system' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setIsDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [theme])

  const setTheme = useCallback(
    (next: ThemeId) => {
      setThemeState(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* ignore storage failures */
      }

      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      if (reduced) return

      // Soft glow pulse riding on top of the token cross-fade.
      const overlay = document.createElement('div')
      overlay.setAttribute('aria-hidden', 'true')
      overlay.style.cssText = [
        'position:fixed',
        'inset:0',
        'z-index:9999',
        'pointer-events:none',
        'opacity:0',
        'background:radial-gradient(80% 60% at 50% 30%, var(--brand-soft), transparent 70%)',
      ].join(';')
      document.body.appendChild(overlay)
      gsap.to(overlay, {
        opacity: 0.35,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => {
          gsap.to(overlay, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
            onComplete: () => overlay.remove(),
          })
        },
      })
    },
    [],
  )

  const getToken = useCallback(
    (name: string) => {
      if (typeof window === 'undefined') return '#059669'
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#059669'
    },
    // Re-created per theme so chart palettes refresh on theme change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme, isDark],
  )

  const value = useMemo(
    () => ({ theme, setTheme, isDark, getToken }),
    [theme, setTheme, isDark, getToken],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>')
  return ctx
}
