import { useEffect, useId, useState } from 'react'
import { cx } from '../../lib/cx'

/**
 * Combined numeric input + slider control.
 *
 * The numeric field is the primary precise control; the slider is optional.
 * Both stay synchronized. The USER TYPES (and the banner shows) the DISPLAY
 * unit (e.g. sq ft); `value`/onChange are CANONICAL (m²). Conversion happens
 * through the provided converters so display units never leak into stored
 * calculations. Validation is EXPLICIT: out-of-range values warn and clamp
 * only on commit, never silently while typing.
 */
export function NumberSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  format,
  hint,
  largeValues = false,
  toDisplay,
  fromDisplay,
}: {
  label: string
  /** Canonical value (e.g. m²). */
  value: number | undefined
  /** Emits a canonical value (e.g. m²). */
  onChange: (value: number | undefined) => void
  /** Canonical minimum. */
  min: number
  /** Canonical slider maximum — generous for large homes. */
  max: number
  /** Canonical step. */
  step?: number
  unit?: string
  /** Formats a CANONICAL value for the banner. */
  format?: (value: number) => string
  hint?: string
  /** Allows typed values beyond `max` up to `hardMax` (realistic large homes). */
  largeValues?: boolean
  /** Canonical → display (identity for metric regions). */
  toDisplay?: (value: number) => number
  /** Display → canonical (identity for metric regions). */
  fromDisplay?: (value: number) => number
}) {
  const id = useId()
  const toD = toDisplay ?? ((v: number) => v)
  const fromD = fromDisplay ?? ((v: number) => v)

  const [text, setText] = useState(value !== undefined ? String(Math.round(toD(value))) : '')
  const [warning, setWarning] = useState<string | null>(null)

  // Keep the text field in sync when the value changes externally (slider).
  useEffect(() => {
    setText(value !== undefined ? String(Math.round(toD(value))) : '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const hardMaxCanonical = largeValues ? Math.max(max * 4, max + 10_000) : max

  const commit = (raw: string) => {
    const trimmed = raw.trim().replace(/,/g, '')
    if (trimmed === '') {
      setWarning(null)
      onChange(undefined)
      return
    }
    const displayValue = Number(trimmed)
    if (Number.isNaN(displayValue)) {
      setWarning('Please enter a valid number.')
      return
    }
    const canonical = fromD(displayValue)
    const displayMin = Math.round(toD(min))
    const displayHardMax = Math.round(toD(hardMaxCanonical))
    if (canonical < min) {
      setWarning(`Minimum is ${new Intl.NumberFormat('en-US').format(displayMin)}${unit ? ` ${unit}` : ''} — using it.`)
      onChange(min)
      return
    }
    if (canonical > hardMaxCanonical) {
      setWarning(
        `Maximum supported is ${new Intl.NumberFormat('en-US').format(displayHardMax)}${unit ? ` ${unit}` : ''} — using it.`,
      )
      onChange(hardMaxCanonical)
      return
    }
    setWarning(null)
    onChange(canonical)
  }

  const displayValue = value !== undefined ? Math.round(toD(value)) : undefined
  const banner =
    value === undefined
      ? '—'
      : format
        ? format(value)
        : `${new Intl.NumberFormat('en-US').format(displayValue ?? 0)}${unit ? ` ${unit}` : ''}`

  const displaySliderMax = Math.round(toD(max))
  const displaySliderMin = Math.round(toD(min))
  const displaySliderStep = Math.max(1, Math.round(toD(step) - toD(0)))

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-text-strong">
          {label}
        </label>
        <span className="font-display text-lg font-bold text-brand">{banner}</span>
      </div>
      <div className="mt-2 flex items-stretch gap-2.5">
        <div className="relative flex-1">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            min={displaySliderMin}
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              const displayValueTyped = Number(event.target.value)
              if (event.target.value !== '' && !Number.isNaN(displayValueTyped)) {
                const canonical = fromD(displayValueTyped)
                if (canonical < min) {
                  setWarning(`Minimum is ${new Intl.NumberFormat('en-US').format(displaySliderMin)}${unit ? ` ${unit}` : ''}.`)
                } else if (canonical > hardMaxCanonical) {
                  setWarning(`Large values above ${new Intl.NumberFormat('en-US').format(displaySliderMax * (largeValues ? 4 : 1))}${unit ? ` ${unit}` : ''} are capped.`)
                } else {
                  setWarning(null)
                }
              } else {
                setWarning(null)
              }
            }}
            onBlur={(event) => commit(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.currentTarget.blur()
            }}
            placeholder="Type an exact value"
            className={cx(
              'w-full rounded-xl border bg-surface-card px-4 py-2.5 text-sm text-text-strong placeholder:text-text-faint',
              'focus:outline-none focus:ring-2 focus:ring-ring/30',
              warning ? 'border-solar focus:border-solar' : 'border-border-base focus:border-brand',
              unit && 'pr-20',
            )}
          />
          {unit && (
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-text-faint">
              {unit}
            </span>
          )}
        </div>
        <div className="flex items-center px-1">
          <input
            type="range"
            min={displaySliderMin}
            max={displaySliderMax}
            step={displaySliderStep}
            value={Math.min(displayValue ?? displaySliderMin, displaySliderMax)}
            onChange={(event) => {
              setWarning(null)
              onChange(fromD(Number(event.target.value)))
            }}
            aria-label={`${label} slider`}
            className="w-full accent-[var(--brand)]"
          />
        </div>
      </div>
      {warning ? (
        <p className="mt-1 text-xs font-medium text-solar">{warning}</p>
      ) : (
        hint && <p className="mt-1 text-xs text-text-faint">{hint}</p>
      )}
    </div>
  )
}
