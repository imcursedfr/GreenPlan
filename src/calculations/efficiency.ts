import type { EfficiencyAssessment, HomeProfile } from '../types'
import { CURRENCY, EFFICIENCY } from '../data/constants'

export interface EfficiencyCalculationContext {
  home: HomeProfile
  /** Annual grid electricity in kWh (12 × monthly). */
  annualElectricityKwh: number
  /** Electricity price per kWh (from the bill, or the default tariff). */
  tariffPerKwh: number
}

export interface EfficiencyCalculationResult {
  assessment: EfficiencyAssessment
  /** Per-measure breakdown for charts/cards. */
  measures: Array<{
    id: string
    label: string
    annualSavingsKwh: number
    cost: number
    paybackYears: number | null
  }>
  assumptions: string[]
  warnings: string[]
}

export function canCalculateEfficiency({
  home,
  annualElectricityKwh,
}: EfficiencyCalculationContext): boolean {
  return annualElectricityKwh > 0 && (home.floorAreaSqm ?? 0) > 0
}

export function calculateEfficiency({
  home,
  annualElectricityKwh,
  tariffPerKwh,
}: EfficiencyCalculationContext): EfficiencyCalculationResult {
  const warnings: string[] = []
  const climateZone = home.climateZone ?? 'temperate'
  const floorArea = home.floorAreaSqm ?? 0
  const coolingLevel = home.coolingUsageLevel ?? 'moderate'

  // 1. Baseline intensity (kWh/m²/yr), normalized for cooling intensity.
  const coolingMultiplier = EFFICIENCY.COOLING_MULTIPLIER[coolingLevel]
  const baselineIntensity = round1(annualElectricityKwh / floorArea / coolingMultiplier)
  const adjustedBaselineKwh = baselineIntensity * floorArea

  // 2. Candidate measures — skip those already adopted.
  const existing = new Set(home.existingMeasures ?? [])
  const candidates = [
    {
      id: 'attic-insulation',
      label: 'Attic/roof insulation',
      share: EFFICIENCY.MEASURE_SAVINGS_SHARE.atticInsulation,
      cost: EFFICIENCY.MEASURE_COSTS.atticInsulation,
      applicable: !existing.has('attic-insulation'),
    },
    {
      id: 'double-glazing',
      label: 'Double glazing',
      share: EFFICIENCY.MEASURE_SAVINGS_SHARE.doubleGlazing,
      cost: EFFICIENCY.MEASURE_COSTS.doubleGlazing,
      applicable: !existing.has('double-glazing'),
    },
    {
      id: 'smart-thermostat',
      label: 'Smart thermostat',
      share: EFFICIENCY.MEASURE_SAVINGS_SHARE.smartThermostat,
      cost: EFFICIENCY.MEASURE_COSTS.smartThermostat,
      applicable: !existing.has('smart-thermostat'),
    },
    {
      id: 'led-lighting',
      label: 'LED lighting retrofit',
      share: EFFICIENCY.MEASURE_SAVINGS_SHARE.ledLighting,
      cost: EFFICIENCY.MEASURE_COSTS.ledLighting,
      applicable: !existing.has('led-lighting'),
    },
    {
      id: 'efficient-ac',
      label: 'High-efficiency AC',
      share: EFFICIENCY.MEASURE_SAVINGS_SHARE.efficientAc,
      cost: EFFICIENCY.MEASURE_COSTS.efficientAc,
      applicable: !existing.has('efficient-ac') && coolingLevel !== 'none',
    },
  ]

  // 3. Savings apply sequentially to the remaining baseline (no double count).
  let remainingKwh = adjustedBaselineKwh
  const measures = candidates
    .filter((measure) => measure.applicable)
    .map((measure) => {
      const annualSavingsKwh = round0(remainingKwh * measure.share)
      remainingKwh -= annualSavingsKwh
      return {
        id: measure.id,
        label: measure.label,
        annualSavingsKwh,
        cost: measure.cost,
        paybackYears:
          annualSavingsKwh > 0 ? round1(measure.cost / (annualSavingsKwh * tariffPerKwh)) : null,
      }
    })

  const annualEnergySavingsKwh = round0(measures.reduce((sum, m) => sum + m.annualSavingsKwh, 0))
  const estimatedCost = round0(measures.reduce((sum, m) => sum + m.cost, 0))
  const annualSavings = round0(annualEnergySavingsKwh * tariffPerKwh)
  const paybackYears = annualSavings > 0 ? round1(estimatedCost / annualSavings) : null

  // 4. Grade from post-measure intensity (kWh/m²/yr buckets).
  const afterIntensity = (adjustedBaselineKwh - annualEnergySavingsKwh) / floorArea
  const grade =
    afterIntensity <= 60
      ? 'A'
      : afterIntensity <= 90
        ? 'B'
        : afterIntensity <= 120
          ? 'C'
          : afterIntensity <= 160
            ? 'D'
            : afterIntensity <= 200
              ? 'E'
              : afterIntensity <= 250
                ? 'F'
                : 'G'

  if (home.coolingUsageLevel === undefined) {
    warnings.push('Cooling usage not specified — assumed moderate.')
  }

  const assumptions = [
    `Baseline intensity ${baselineIntensity} kWh/m²/yr (climate "${climateZone}", cooling multiplier ×${coolingMultiplier}).`,
    'Measure savings apply sequentially to the remaining baseline (no double counting).',
    `Tariff ${tariffPerKwh.toFixed(2)}/kWh applied to saved energy.`,
  ]

  const assessment: EfficiencyAssessment = {
    annualEnergySavingsKwh,
    estimatedCost,
    currency: CURRENCY,
    annualSavings,
    paybackYears,
    grade,
  }

  return { assessment, measures, assumptions, warnings }
}

function round0(value: number): number {
  return Math.round(value)
}
function round1(value: number): number {
  return Math.round(value * 10) / 10
}
