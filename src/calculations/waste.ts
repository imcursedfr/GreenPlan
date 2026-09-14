import type { HomeProfile, WasteAssessment } from '../types'
import { WASTE } from '../data/constants'

export interface WasteCalculationContext {
  home: HomeProfile
}

export interface WasteCalculationResult {
  assessment: WasteAssessment
  /** Actionable diversion opportunities with deterministic impact. */
  opportunities: Array<{
    id: string
    label: string
    annualCo2AvoidedKg: number
    alreadyAdopted: boolean
  }>
  assumptions: string[]
  warnings: string[]
}

export function canCalculateWaste({ home }: WasteCalculationContext): boolean {
  return (home.householdSize ?? 0) > 0
}

export function calculateWaste({ home }: WasteCalculationContext): WasteCalculationResult {
  const warnings: string[] = []
  const householdSize = home.householdSize ?? 0

  // 1. Annual waste from per-capita generation.
  const annualWasteKg = round0(householdSize * WASTE.WASTE_PER_CAPITA_KG)

  // 2. Diversion potential from adopted measures.
  const existing = new Set(home.existingMeasures ?? [])
  const hasRecycling = existing.has('recycling-program')
  const hasComposting = existing.has('composting')

  const recyclingShare = hasRecycling ? WASTE.DIVERSION_SHARE.recyclingProgram : 0
  const compostingShare = hasComposting ? WASTE.DIVERSION_SHARE.composting : 0
  const diversionPotential = round2(Math.min(0.9, recyclingShare + compostingShare))

  const divertedKg = round0(annualWasteKg * diversionPotential)
  const annualCo2AvoidedKg = round0(divertedKg * WASTE.LANDFILL_CO2_PER_KG)

  // 3. Opportunities: show what each remaining measure would add.
  const baseDiverted = annualWasteKg * diversionPotential
  const opportunities = [
    {
      id: 'recycling-program',
      label: 'Join/expand a recycling program',
      share: WASTE.DIVERSION_SHARE.recyclingProgram,
      alreadyAdopted: hasRecycling,
    },
    {
      id: 'composting',
      label: 'Start home composting',
      share: WASTE.DIVERSION_SHARE.composting,
      alreadyAdopted: hasComposting,
    },
  ].map((opportunity) => {
    const addedKg = opportunity.alreadyAdopted
      ? annualWasteKg * opportunity.share
      : Math.min(annualWasteKg - baseDiverted, annualWasteKg * opportunity.share)
    return {
      id: opportunity.id,
      label: opportunity.label,
      annualCo2AvoidedKg: round0(Math.max(0, addedKg) * WASTE.LANDFILL_CO2_PER_KG),
      alreadyAdopted: opportunity.alreadyAdopted,
    }
  })

  if (!home.existingMeasures || home.existingMeasures.length === 0) {
    warnings.push('No existing measures reported — diversion potential may be understated if you already recycle.')
  }

  const assumptions = [
    `Per-capita waste ${WASTE.WASTE_PER_CAPITA_KG} kg/yr × ${householdSize} occupants.`,
    `Diversion shares: recycling ${WASTE.DIVERSION_SHARE.recyclingProgram * 100}%, composting ${WASTE.DIVERSION_SHARE.composting * 100}%.`,
    `Landfill emission factor ${WASTE.LANDFILL_CO2_PER_KG} kg CO₂e per kg waste.`,
  ]

  const assessment: WasteAssessment = {
    annualWasteKg,
    diversionPotential,
    annualCo2AvoidedKg,
  }

  return { assessment, opportunities, assumptions, warnings }
}

function round0(value: number): number {
  return Math.round(value)
}
function round2(value: number): number {
  return Math.round(value * 100) / 100
}
