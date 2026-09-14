export type ThemeId = 'terra' | 'ocean' | 'forest' | 'solar' | 'midnight' | 'system'

export interface ThemeDefinition {
  id: ThemeId
  label: string
  description: string
  /** Swatch colors for the switcher preview chips. */
  swatches: [string, string, string]
  /** Whether the theme is dark on its own (used for chart text/grid colors). */
  dark: boolean
}

export const themes: ThemeDefinition[] = [
  {
    id: 'system',
    label: 'System',
    description: 'Follows your device setting',
    swatches: ['#f6f8f6', '#059669', '#0a1220'],
    dark: false,
  },
  {
    id: 'terra',
    label: 'Terra',
    description: 'Warm earth & clay tones',
    swatches: ['#f7f4ef', '#b45309', '#4a4038'],
    dark: false,
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Clean coastal climate-tech',
    swatches: ['#f3f8fb', '#0369a1', '#0b2237'],
    dark: false,
  },
  {
    id: 'forest',
    label: 'Forest',
    description: 'Deep natural sustainability',
    swatches: ['#eef4ee', '#166534', '#122416'],
    dark: false,
  },
  {
    id: 'solar',
    label: 'Solar',
    description: 'Bright renewable energy',
    swatches: ['#fdf9f1', '#d97706', '#574321'],
    dark: false,
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Premium dark interface',
    swatches: ['#0a1220', '#34d399', '#f1f5f9'],
    dark: true,
  },
]

export const defaultTheme: ThemeId = 'system'

export function isDarkTheme(theme: ThemeId): boolean {
  if (theme === 'system') {
    if (typeof window === 'undefined' || !window.matchMedia) return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  return themes.find((t) => t.id === theme)?.dark ?? false
}
