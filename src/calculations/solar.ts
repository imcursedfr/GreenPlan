import type { EnergyProfile, HomeProfile, SolarAssessment } from '../types'
import { CURRENCY, SOLAR } from '../data/constants'

/**
 * Deterministic solar engine.
 *
 * Every constant is documented in src/data/constants.ts. The LLM never
 * computes any of these values — it only explains the returned assessment.
 */
export interface SolarCalculationContext {
  home: HomeProfile
  energy: EnergyProfile
}

export interface SolarCalculationResult {
  assessment: SolarAssessment
  /** Formula-derived assumptions to display in the UI. */
  assumptions: string[]
  /** Missing/degraded inputs surfaced to the user. */
  warnings: string[]
}

/** True when roof area + consumption exist and are positive. */
export function canCalculateSolar({ home, energy }: SolarCalculationContext): boolean {
  return (home.roofAreaSqm ?? 0) > 0 && (energy.monthlyElectricityKwh ?? 0) > 0
}

export function calculateSolar({ home, energy }: SolarCalculationContext): SolarCalculationResult {
  const warnings: string[] = []

  const roofArea = home.roofAreaSqm ?? 0
  const monthlyKwh = energy.monthlyElectricityKwh ?? 0
  const annualConsumption = monthlyKwh * 12
  const climateZone = home.climateZone ?? 'temperate'
  const roofOrientation = home.roofOrientation ?? 'unknown'

  // 1. Recommended capacity: roof-limited and consumption-limited, min 1 kWp.
  const roofCapacityKwp = roofArea * SOLAR.ROOF_FILL_RATIO * SOLAR.PANEL_EFFICIENCY_KWP_PER_SQM
  const consumptionCapKwp = annualConsumption / (365 * SOLAR.PEAK_SUN_HOURS[climateZone])
  const recommendedKwp = Math.max(1, Math.min(roofCapacityKwp, consumptionCapKwp))
  const systemSizeKwp = round2(recommendedKwp)

  // 2. Generation: peak-sun-hours × orientation × system losses × degradation.
  const orientationFactor = SOLAR.ORIENTATION_FACTOR[roofOrientation]
  const annualGenerationKwh = round0(
    systemSizeKwp *
      365 *
      SOLAR.PEAK_SUN_HOURS[climateZone] *
      orientationFactor *
      SOLAR.SYSTEM_LOSSES *
      SOLAR.ANNUAL_DEGRADATION_FACTOR,
  )

  // 3. Cost & savings. Tariff from the bill when available, else a default.
  const installationCost = round0(systemSizeKwp * SOLAR.COST_PER_KWP)
  const tariff =
    energy.monthlyBillAmount && monthlyKwh > 0
      ? energy.monthlyBillAmount / monthlyKwh
      : DEFAULT_TARIFF
  const effectiveTariff =
    SOLAR.SELF_CONSUMPTION * tariff + (1 - SOLAR.SELF_CONSUMPTION) * SOLAR.EXPORT_TARIFF
  const annualSavings = round0(
    annualGenerationKwh * effectiveTariff - systemSizeKwp * SOLAR.ANNUAL_OM_PER_KWP,
  )
  const paybackYears = annualSavings > 0 ? round1(installationCost / annualSavings) : null

  // 3b. CO₂ avoided.
  const annualCo2AvoidedKg = round0(annualGenerationKwh * SOLAR.CO2_PER_KWH)

  // 4. Roof suitability 0–100: fill share, orientation, consumption match.
  const fillShare = Math.min(1, recommendedKwp / Math.max(roofCapacityKwp, 0.001))
  const consumptionMatch = Math.min(1, annualGenerationKwh / Math.max(annualConsumption, 1))
  const suitabilityScore = round0(
    (0.5 * fillShare + 0.3 * orientationFactor + 0.2 * consumptionMatch) * 100,
  )

  if (roofOrientation === 'unknown') {
    warnings.push(
      'Roof orientation not provided — a 0.88 yield factor was assumed. Pick an orientation for a sharper estimate.',
    )
  }
  const assumptions = [
    `${SOLAR.ROOF_FILL_RATIO * 100}% of roof area usable → ${round1(roofArea * SOLAR.ROOF_FILL_RATIO)} m² of panels.`,
    `Climate zone "${climateZone}" → ${SOLAR.PEAK_SUN_HOURS[climateZone]} peak-sun-hours/day, orientation "${roofOrientation}" factor ${orientationFactor}.`,
    `System losses ${SOLAR.SYSTEM_LOSSES}, degradation-adjusted output factor ${SOLAR.ANNUAL_DEGRADATION_FACTOR}.`,
    `Tariff ${tariff.toFixed(2)}/kWh weighted by ${SOLAR.SELF_CONSUMPTION * 100}% self-consumption and ${SOLAR.EXPORT_TARIFF}/kWh export.`,
  ]
  if (!energy.monthlyBillAmount) {
    assumptions.push(`Bill not provided — used the ${DEFAULT_TARIFF}/kWh default tariff.`)
  }

  const assessment: SolarAssessment = {
    systemSizeKwp,
    annualGenerationKwh,
    installationCost,
    currency: CURRENCY,
    annualSavings,
    paybackYears,
    annualCo2AvoidedKg,
    coverageRatio: round2(consumptionMatch),
    roofSuitabilityScore: suitabilityScore,
  }

  return { assessment, assumptions, warnings }
}

const DEFAULT_TARIFF = 0.28

function round0(value: number): number {
  return Math.round(value)
}
function round1(value: number): number {
  return Math.round(value * 10) / 10
}
function round2(value: number): number {
  return Math.round(value * 100) / 100
}
