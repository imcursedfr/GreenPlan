import { useId, useState, type ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'
import { cx } from '../../lib/cx'

/** Single-choice visual card. */
export function OptionCard({
  selected,
  onClick,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean
  onClick: () => void
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        'flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200',
        selected
          ? 'border-brand bg-brand-softer ring-2 ring-ring/30'
          : 'border-border-base bg-surface-card hover:border-border-strong hover:bg-surface-hover',
      )}
    >
      {Icon && (
        <span
          className={cx(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            selected ? 'bg-brand text-brand-contrast' : 'bg-surface-muted text-text-muted',
          )}
        >
          <Icon className="size-4.5" aria-hidden />
        </span>
      )}
      <span>
        <span className="block text-sm font-semibold text-text-strong">{title}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-text-muted">{description}</span>}
      </span>
    </button>
  )
}

/** Multi-select visual card with check indicator. */
export function MultiOptionCard({
  selected,
  onToggle,
  icon: Icon,
  title,
  description,
}: {
  selected: boolean
  onToggle: () => void
  icon?: React.ComponentType<{ className?: string }>
  title: string
  description?: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cx(
        'relative flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200',
        selected
          ? 'border-brand bg-brand-softer ring-2 ring-ring/30'
          : 'border-border-base bg-surface-card hover:border-border-strong hover:bg-surface-hover',
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 size-2 rounded-full bg-brand" aria-hidden />
      )}
      {Icon && (
        <span
          className={cx(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            selected ? 'bg-brand text-brand-contrast' : 'bg-surface-muted text-text-muted',
          )}
        >
          <Icon className="size-4.5" aria-hidden />
        </span>
      )}
      <span>
        <span className="block text-sm font-semibold text-text-strong">{title}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-text-muted">{description}</span>}
      </span>
    </button>
  )
}

/** Labeled range slider with formatted value display. */
export function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  hint,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  format?: (value: number) => string
  hint?: string
}) {
  const id = useId()
  const display = format ? format(value) : String(value)

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-text-strong">
          {label}
        </label>
        <span className="font-display text-lg font-bold text-brand">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-2 w-full accent-[var(--brand)]"
      />
      {hint && <p className="mt-1 text-xs text-text-faint">{hint}</p>}
    </div>
  )
}

/** Number field with unit suffix. */
export function NumberField({
  label,
  value,
  onChange,
  unit,
  placeholder,
  min = 0,
  max,
  hint,
}: {
  label: string
  value: number | undefined
  onChange: (value: number | undefined) => void
  unit?: string
  placeholder?: string
  min?: number
  max?: number
  hint?: string
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-text-strong">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          value={value ?? ''}
          placeholder={placeholder}
          onChange={(event) => {
            const raw = event.target.value
            onChange(raw === '' ? undefined : Number(raw))
          }}
          className={cx(
            'w-full rounded-xl border border-border-base bg-surface-card px-4 py-2.5 text-sm text-text-strong placeholder:text-text-faint',
            'focus:border-brand focus:outline-none focus:ring-2 focus:ring-ring/30',
            unit && 'pr-14',
          )}
        />
        {unit && (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-text-faint">
            {unit}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-text-faint">{hint}</p>}
    </div>
  )
}

/** Question-label with an optional hover/tap tooltip. */
export function FieldLabel({ children, tooltip }: { children: ReactNode; tooltip?: string }) {
  const [open, setOpen] = useState(false)
  if (!tooltip) return <span className="text-sm font-medium text-text-strong">{children}</span>
  return (
    <span className="relative inline-flex items-center gap-1.5">
      <span className="text-sm font-medium text-text-strong">{children}</span>
      <button
        type="button"
        aria-label={`Help: ${children}`}
        onClick={() => setOpen((value) => !value)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="text-text-faint transition-colors hover:text-brand"
      >
        <HelpCircle className="size-3.5" aria-hidden />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-0 z-20 mb-1.5 w-56 rounded-xl border border-border-base bg-surface-card p-2.5 text-xs leading-relaxed text-text-body shadow-card-hover"
        >
          {tooltip}
        </span>
      )}
    </span>
  )
}
