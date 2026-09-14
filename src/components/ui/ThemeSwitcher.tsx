import { useEffect, useState } from 'react'
import { useTheme } from '../../theme/ThemeProvider'
import { themes, type ThemeId } from '../../theme/themes'
import { cx } from '../../lib/cx'
import { useClickOutside } from './useClickOutside'

/**
 * Global theme selector.
 *
 * - Available in both layouts (desktop popover + mobile-friendly panel).
 * - Shows live swatch previews; the active theme is checked.
 * - Opens/closes with a small GSAP scale/fade, closes on outside click/Escape.
 * - Does not reserve layout space (absolute positioning) → no layout shift.
 */
export function ThemeSwitcher({ align = 'right' }: { align?: 'left' | 'right' }) {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const menuRef = useClickOutside<HTMLDivElement>(() => setOpen(false), open)
  const active = themes.find((t) => t.id === theme) ?? themes[0]

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const choose = (id: ThemeId) => {
    setTheme(id)
    setOpen(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Theme: ${active.label}. Change theme`}
        className="flex items-center gap-2 rounded-xl border border-border-base bg-surface-card px-2.5 py-2 text-xs font-medium text-text-body shadow-card transition hover:border-border-strong hover:text-text-strong"
      >
        <span className="flex -space-x-1" aria-hidden>
          {active.swatches.map((color) => (
            <span
              key={color}
              className="size-3.5 rounded-full border border-surface-card"
              style={{ backgroundColor: color }}
            />
          ))}
        </span>
        <span className="hidden sm:inline">{active.label}</span>
      </button>

      {open && (
        <ThemeMenu selected={theme} onSelect={choose} align={align} />
      )}
    </div>
  )
}

function ThemeMenu({
  selected,
  onSelect,
  align,
}: {
  selected: ThemeId
  onSelect: (id: ThemeId) => void
  align: 'left' | 'right'
}) {
  const ref = useClickOutside<HTMLDivElement>(() => {}, true)

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label="Theme"
      data-animate="theme-menu"
      className={cx(
        'absolute top-[calc(100%+8px)] z-50 w-64 overflow-hidden rounded-2xl border border-border-base bg-surface-card p-1.5 shadow-card-hover',
        align === 'right' ? 'right-0' : 'left-0',
      )}
    >
      {themes.map((option) => (
        <button
          key={option.id}
          type="button"
          role="option"
          aria-selected={option.id === selected}
          onClick={() => onSelect(option.id)}
          className={cx(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition',
            option.id === selected ? 'bg-brand-softer' : 'hover:bg-surface-hover',
          )}
        >
          <span className="flex shrink-0 flex-wrap gap-0.5" aria-hidden>
            {option.swatches.map((color) => (
              <span
                key={color}
                className="size-4 rounded-md border border-border-base"
                style={{ backgroundColor: color }}
              />
            ))}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-text-strong">{option.label}</span>
            <span className="block truncate text-xs text-text-muted">{option.description}</span>
          </span>
          {option.id === selected && (
            <span className="size-2 shrink-0 rounded-full bg-brand" aria-hidden />
          )}
        </button>
      ))}
    </div>
  )
}
