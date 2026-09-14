import type { SustainabilityScore } from '../types'
import type { PlannerProfile } from '../types/profile'
import { canCalculateSolar, calculateSolar } from './solar'
import { canCalculateWater, calculateWater } from './water'
import { canCalculateEfficiency, calculateEfficiency } from './efficiency'
import { canCalculateWaste, calculateWaste } from './waste'

export interface AssessmentBundle {
  score: SustainabilityScore
  solar: ReturnType<typeof calculateSolar> | null
  water: ReturnType<typeof calculateWater> | null
  efficiency: ReturnType<typeof calculateEfficiency> | null
  waste: ReturnType<typeof calculateWaste> | null
  /** Modules that could not run due to missing inputs. */
  missing: Array<'solar' | 'water' | 'efficiency' | 'waste'>
  warnings: string[]
  /** Per-kWh tariff used across engines (bill-derived or default). */
  tariffPerKwh: number
}

/**
 * Runs every engine against the profile and aggregates a 0–100 score.
 *
 * Missing-data policy: a module with insufficient inputs scores null and is
 * reported in `missing` — the UI shows uncertainty instead of inventing data.
 * The overall score is null until at least one module has data.
 */
export function assessProfile(profile: PlannerProfile): AssessmentBundle {
  const tariff = deriveTariff(profile)

  const solar = canCalculateSolar(profile) ? calculateSolar(profile) : null
  const water = canCalculateWater(profile) ? calculateWater(profile) : null
  const efficiency =
    canCalculateEfficiency({ home: profile.home, annualElectricityKwh: annualKwh(profile), tariffPerKwh: tariff })
      ? calculateEfficiency({ home: profile.home, annualElectricityKwh: annualKwh(profile), tariffPerKwh: tariff })
      : null
  const waste = canCalculateWaste(profile) ? calculateWaste(profile) : null

  const missing: AssessmentBundle['missing'] = []
  if (!solar) missing.push('solar')
  if (!water) missing.push('water')
  if (!efficiency) missing.push('efficiency')
  if (!waste) missing.push('waste')

  const warnings: string[] = []
  for (const result of [solar, water, efficiency, waste]) {
    if (result) warnings.push(...result.warnings)
  }

  // ── Category scores (0–100 each; null = no data) ────────────────────────
  const solarScore = solar
    ? Math.round(
        0.4 * (solar.assessment.coverageRatio * 100) +
        0.35 * solar.assessment.roofSuitabilityScore +
        0.25 * paybackScore(solar.assessment.paybackYears, 12),
      )
    : null

  const waterScore = water
    ? Math.round(
        0.6 * (water.assessment.demandCoverageRatio * 100) +
        0.4 * paybackScore(water.assessment.paybackYears, 15),
      )
    : null

  const efficiencyScore = efficiency
    ? Math.round(
        0.55 * gradeScore(efficiency.assessment.grade) +
        0.45 * paybackScore(efficiency.assessment.paybackYears, 10),
      )
    : null

  const wasteScore = waste
    ? Math.round(waste.assessment.diversionPotential * 100)
    : null

  const breakdown = {
    solar: solarScore,
    water: waterScore,
    efficiency: efficiencyScore,
    waste: wasteScore,
  } satisfies SustainabilityScore['breakdown']

  const available = Object.values(breakdown).filter((v): v is number => v !== null)
  const overall =
    available.length >= 2
      ? Math.round(available.reduce((sum, value) => sum + value, 0) / available.length)
      : null

  const score: SustainabilityScore = {
    overall,
    breakdown,
    summary: overall !== null ? summarize(overall) : undefined,
  }

  return { score, solar, water, efficiency, waste, missing, warnings, tariffPerKwh: tariff }
}

/** Simple payback → score (0–100), capped at a max credible payback. */
function paybackScore(paybackYears: number | null, maxYears: number): number {
  if (paybackYears === null || paybackYears <= 0) return 0
  return Math.max(0, Math.round(100 * (1 - paybackYears / maxYears)))
}

/** Efficiency grade A–G → 100–0. */
function gradeScore(grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | undefined): number {
  if (!grade) return 0
  return (7 - (grade.charCodeAt(0) - 64)) * (100 / 6)
}

function summarize(overall: number): string {
  if (overall >= 80) return 'Excellent — your home is already highly sustainable.'
  if (overall >= 60) return 'Strong potential — targeted upgrades will pay off quickly.'
  if (overall >= 40) return 'Average footprint — several high-value opportunities found.'
  return 'High-impact potential — significant savings and CO₂ reductions available.'
}

/** Bill-derived tariff when possible, else the documented default. */
function deriveTariff(profile: PlannerProfile): number {
  const { energy } = profile
  if (energy.monthlyBillAmount && energy.monthlyElectricityKwh && energy.monthlyElectricityKwh > 0) {
    return round2(energy.monthlyBillAmount / energy.monthlyElectricityKwh)
  }
  return DEFAULT_TARIFF
}

function annualKwh(profile: PlannerProfile): number {
  return (profile.energy.monthlyElectricityKwh ?? 0) * 12
}

const DEFAULT_TARIFF = 0.28

function round2(value: number): number {
  return Math.round(value * 100) / 100
}
