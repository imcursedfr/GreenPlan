/**
 * Centralized region/locale configuration.
 *
 * Canonical internal calculation units NEVER change:
 *   area → m², volume → m³, energy → kWh, money → a single ISO currency code.
 * This module only governs DISPLAY: currency symbol, area unit (m² vs sq ft),
 * and volume display (litres vs gallons). Every UI surface must format values
 * through these helpers instead of hardcoding "$" or "m²".
 */

export type RegionCode = 'IN' | 'US' | 'GB' | 'EU' | 'DEFAULT'

export interface RegionConfig {
  code: RegionCode
  label: string
  currency: string
  currencySymbol: string
  /** Display unit for floor/roof area. Canonical storage stays m². */
  areaUnit: 'm²' | 'sq ft'
  /** Display unit for water volumes below 1 m³. Canonical storage stays m³. */
  waterUnit: 'L' | 'gal'
  /** Factor: canonical m² → display unit. */
  areaFactor: number
}

const SQFT_PER_SQM = 10.7639
const GAL_PER_M3 = 264.172

const REGIONS: Record<RegionCode, RegionConfig> = {
  IN: {
    code: 'IN',
    label: 'India',
    currency: 'INR',
    currencySymbol: '₹',
    areaUnit: 'sq ft',
    waterUnit: 'L',
    areaFactor: SQFT_PER_SQM,
  },
  US: {
    code: 'US',
    label: 'United States',
    currency: 'USD',
    currencySymbol: '$',
    areaUnit: 'sq ft',
    waterUnit: 'gal',
    areaFactor: SQFT_PER_SQM,
  },
  GB: {
    code: 'GB',
    label: 'United Kingdom',
    currency: 'GBP',
    currencySymbol: '£',
    areaUnit: 'sq ft',
    waterUnit: 'L',
    areaFactor: SQFT_PER_SQM,
  },
  EU: {
    code: 'EU',
    label: 'Europe',
    currency: 'EUR',
    currencySymbol: '€',
    areaUnit: 'm²',
    waterUnit: 'L',
    areaFactor: 1,
  },
  DEFAULT: {
    code: 'DEFAULT',
    label: 'International',
    currency: 'USD',
    currencySymbol: '$',
    areaUnit: 'm²',
    waterUnit: 'L',
    areaFactor: 1,
  },
}

/** ISO-3166 alpha-2 → region. Unlisted countries fall back gracefully. */
const COUNTRY_TO_REGION: Record<string, RegionCode> = {
  IN: 'IN',
  US: 'US',
  GB: 'GB',
  // Eurozone (subset that matters most; others fall back to DEFAULT)
  DE: 'EU', FR: 'EU', ES: 'EU', IT: 'EU', NL: 'EU', BE: 'EU', AT: 'EU',
  PT: 'EU', IE: 'EU', FI: 'EU', GR: 'EU', SK: 'EU', SI: 'EU', HR: 'EU',
  LU: 'EU', EE: 'EU', LV: 'EU', LT: 'EU', CY: 'EU', MT: 'EU',
}

/**
 * Resolve a region from a country code obtained by geocoding.
 * Unknown codes map to DEFAULT — never throws.
 */
export function regionFromCountry(countryCode?: string): RegionConfig {
  if (!countryCode) return REGIONS.DEFAULT
  return REGIONS[COUNTRY_TO_REGION[countryCode.toUpperCase()] ?? 'DEFAULT']
}

export function regionConfig(code: RegionCode | string | undefined): RegionConfig {
  if (!code) return REGIONS.DEFAULT
  return REGIONS[code as RegionCode] ?? REGIONS.DEFAULT
}

// ── Display helpers ─────────────────────────────────────────────────────────

/** Format a canonical m² area in the region's display unit. */
export function formatArea(sqm: number, region: RegionConfig, decimals = 0): string {
  const value = sqm * region.areaFactor
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: decimals }).format(value)} ${region.areaUnit}`
}

/** Format a canonical m³ water volume in the region's display unit. */
export function formatVolume(m3: number, region: RegionConfig): string {
  return region.waterUnit === 'gal'
    ? `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(m3 * GAL_PER_M3)} gal`
    : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(m3 * 1000)} L`
}

/** Convert a typed display-unit area back to canonical m². */
export function displayAreaToSqm(displayValue: number, region: RegionConfig): number {
  return displayValue / region.areaFactor
}

/** Convert canonical m² to the display unit for input fields. */
export function sqmToDisplayArea(sqm: number, region: RegionConfig): number {
  return sqm * region.areaFactor
}

/** Format a number in the region's currency (uses Intl, symbol included). */
export function formatRegionCurrency(value: number, region: RegionConfig): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: region.currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${region.currencySymbol}${new Intl.NumberFormat('en-US').format(Math.round(value))}`
  }
}

export const GAL_PER_M3_EXPORT = GAL_PER_M3
