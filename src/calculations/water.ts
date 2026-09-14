import type { HomeProfile, WaterAssessment, WaterProfile } from '../types'
import { CURRENCY, WATER } from '../data/constants'

export interface WaterCalculationContext {
  home: HomeProfile
  water: WaterProfile
}

export interface WaterCalculationResult {
  assessment: WaterAssessment
  assumptions: string[]
  warnings: string[]
}

/** True when roof area + water usage exist and are positive. */
export function canCalculateWater({ home, water }: WaterCalculationContext): boolean {
  return (home.roofAreaSqm ?? 0) > 0 && (water.monthlyWaterM3 ?? 0) > 0
}

export function calculateWater({ home, water }: WaterCalculationContext): WaterCalculationResult {
  const warnings: string[] = []
  const climateZone = home.climateZone ?? 'temperate'
  const roofArea = home.roofAreaSqm ?? 0
  const monthlyM3 = water.monthlyWaterM3 ?? 0
  const annualDemandLiters = monthlyM3 * 1000 * 12

  // 1. Harvestable rainwater: roof × rainfall × runoff × usable fraction.
  const annualHarvestLiters = round0(
    roofArea *
      WATER.ANNUAL_RAINFALL_MM[climateZone] *
      WATER.RUNOFF_COEFFICIENT *
      WATER.USABLE_FRACTION,
  )

  // 2. Storage: 14-day buffer of the harvestable share of daily demand.
  const dailyDemandLiters = annualDemandLiters / 365
  const recommendedStorageLiters = round0(
    Math.min(dailyDemandLiters * WATER.STORAGE_BUFFER_DAYS, annualHarvestLiters / 6),
  )
  const storageCost =
    (recommendedStorageLiters / 1000) * WATER.TANK_COST_PER_1000L + WATER.SYSTEM_FIXED_COST

  // 3. Utilizable volume limited by demand and storage turnover.
  const usableHarvestLiters = Math.min(annualHarvestLiters, annualDemandLiters)
  const demandCoverageRatio = round2(Math.min(1, usableHarvestLiters / Math.max(annualDemandLiters, 1)))

  // 4. Savings: offset municipal volume × tariff.
  const annualSavings = round0(usableHarvestLiters / 1000 * WATER.WATER_TARIFF_PER_M3)
  const estimatedSystemCost = round0(storageCost)
  const paybackYears = annualSavings > 0 ? round1(estimatedSystemCost / annualSavings) : null

  if (!water.hasGarden) {
    warnings.push(
      'No garden indicated — non-potable reuse (toilet/laundry) needs plumbing changes; savings assume offset municipal use.',
    )
  }

  const assumptions = [
    `Climate zone "${climateZone}" → ${WATER.ANNUAL_RAINFALL_MM[climateZone]} mm annual rainfall.`,
    `Runoff coefficient ${WATER.RUNOFF_COEFFICIENT}, usable fraction ${WATER.USABLE_FRACTION} (first-flush & filter losses).`,
    `Storage sized for a ${WATER.STORAGE_BUFFER_DAYS}-day buffer of daily demand, capped at 1/6 of annual harvest.`,
    `Municipal water tariff ${WATER.WATER_TARIFF_PER_M3}/m³.`,
  ]

  const assessment: WaterAssessment = {
    annualHarvestLiters,
    recommendedStorageLiters,
    estimatedSystemCost,
    currency: CURRENCY,
    annualSavings,
    paybackYears,
    demandCoverageRatio,
  }

  return { assessment, assumptions, warnings }
}

function round0(value: number): number {
  return Math.round(value)
}
function round1(value: number): number {
  return Math.round(value * 10) / 10
}
function round2(value: number): number {
  return Math.round(value * 100) / 100
}
