import { useTheme } from '../theme/ThemeProvider'

export interface ChartPalette {
  /** Categorical colors in chart order. */
  series: [string, string, string, string, string, string]
  /** Semantic accents for specific modules. */
  brand: string
  solar: string
  water: string
  efficiency: string
  waste: string
  grid: string
  axisText: string
  tooltip: React.CSSProperties
}

/**
 * Recharts renders SVG with inline colors, so it cannot react to CSS classes.
 * This hook reads the themed CSS variables at render time; the ThemeProvider
 * recreates `getToken` on every theme change so charts re-render themed.
 */
export function useChartPalette(): ChartPalette {
  const { getToken, isDark } = useTheme()

  return {
    series: [
      getToken('--chart-1'),
      getToken('--chart-2'),
      getToken('--chart-3'),
      getToken('--chart-4'),
      getToken('--chart-5'),
      getToken('--chart-6'),
    ],
    brand: getToken('--brand'),
    solar: getToken('--solar'),
    water: getToken('--aqua'),
    efficiency: getToken('--skye'),
    waste: getToken('--lime'),
    grid: getToken('--chart-grid'),
    axisText: isDark ? '#94a3b8' : getToken('--text-muted'),
    tooltip: {
      backgroundColor: getToken('--surface-card'),
      border: `1px solid ${getToken('--border-strong')}`,
      borderRadius: 12,
      color: getToken('--text-strong'),
      boxShadow: '0 8px 24px rgb(0 0 0 / 0.12)',
      fontSize: 13,
    },
  }
}
