/**
 * Money formatting — canonical USD inside, regional currency at display.
 *
 * All deterministic engines produce USD amounts (see src/data/constants.ts).
 * Pages format EVERY money value through formatCurrency, which applies a
 * fixed FX table to the user's region. This keeps engines untouched while
 * making all displayed costs/savings/budgets regionally meaningful.
 */

/** Units of target currency per 1 USD (fixed hackathon rates, documented). */
export const FX_PER_USD: Record<string, number> = {
  USD: 1,
  INR: 83.5,
  GBP: 0.79,
  EUR: 0.92,
}

/** Convert a USD-canonical amount into the target currency. */
export function convertFromUsd(usd: number, currency: string): number {
  return usd * (FX_PER_USD[currency] ?? 1)
}

/** Convert a user-typed amount in the target currency back to USD-canonical. */
export function convertToUsd(amount: number, currency: string): number {
  return amount / (FX_PER_USD[currency] ?? 1)
}

/** FX rate (target units per USD) for a currency code. */
export function fxPerUsd(currency: string): number {
  return FX_PER_USD[currency] ?? 1
}

const SYMBOLS: Record<string, string> = { INR: '₹', USD: '$', GBP: '£', EUR: '€' }

/**
 * Format a USD-canonical amount in the target currency.
 * Falls back to a plain symbol prefix when Intl lacks the currency.
 */
export function formatCurrency(valueUsd: number, currency = 'USD'): string {
  const converted = convertFromUsd(valueUsd, currency)
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(converted)
  } catch {
    return `${SYMBOLS[currency] ?? ''}${new Intl.NumberFormat('en-US').format(Math.round(converted))}`
  }
}

/** Format a number with fixed decimals, dropping trailing zeros when clean. */
export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value)
}
