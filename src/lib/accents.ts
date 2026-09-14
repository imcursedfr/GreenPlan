/**
 * Accent tone vocabulary. Every tone maps to themed CSS-variable tokens
 * (see styles/index.css), so all components adapt to the active theme
 * automatically.
 */
export type AccentTone = 'brand' | 'aqua' | 'solar' | 'skye' | 'lime' | 'neutral'

/** Tinted square behind an icon (metric cards, module cards, placeholders). */
export const chipTones: Record<AccentTone, string> = {
  brand: 'bg-brand-soft text-brand-text',
  aqua: 'bg-aqua-soft text-text-strong',
  solar: 'bg-solar-soft text-text-strong',
  skye: 'bg-skye-soft text-text-strong',
  lime: 'bg-lime-soft text-text-strong',
  neutral: 'bg-surface-muted text-text-muted',
}

/** Small pill label (badges). */
export const badgeTones: Record<AccentTone, string> = {
  brand: 'bg-brand-softer text-brand-text ring-brand',
  aqua: 'bg-aqua-soft text-text-strong ring-aqua',
  solar: 'bg-solar-soft text-text-strong ring-solar',
  skye: 'bg-skye-soft text-text-strong ring-skye',
  lime: 'bg-lime-soft text-text-strong ring-lime',
  neutral: 'bg-surface-muted text-text-muted ring-border-strong',
}

/** Dotted bullet color for lists (static classes, theme-aware). */
export const dotTones: Record<AccentTone, string> = {
  brand: 'bg-brand',
  aqua: 'bg-aqua',
  solar: 'bg-solar',
  skye: 'bg-skye',
  lime: 'bg-lime',
  neutral: 'bg-text-faint',
}
