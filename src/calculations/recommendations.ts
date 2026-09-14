import type { Recommendation } from '../types'
import type { PlannerProfile } from '../types/profile'
import type { AssessmentBundle } from './sustainability'
import { WASTE } from '../data/constants'

/**
 * Deterministic recommendation builder.
 *
 * Every recommendation cites the assessment figures it derives from
 * (`derivedFrom`), keeping the numeric chain auditable — the AI may reorder
 * and personalize wording, never the numbers.
 */
export function buildRecommendations(profile: PlannerProfile, bundle: AssessmentBundle): Recommendation[] {
  const recommendations: Recommendation[] = []
  const currency = 'USD'

  // ── Solar ────────────────────────────────────────────────────────────────
  if (bundle.solar && !profile.home.existingMeasures?.includes('rooftop-solar')) {
    const a = bundle.solar.assessment
    recommendations.push({
      id: 'solar-installation',
      category: 'solar',
      title: `Install a ${a.systemSizeKwp} kWp rooftop solar array`,
      rationale:
        `Your roof supports ${a.systemSizeKwp} kWp covering ${Math.round(a.coverageRatio * 100)}% of your electricity. ` +
        `Generation of ${Math.round(a.annualGenerationKwh).toLocaleString()} kWh/yr avoids ${Math.round(a.annualCo2AvoidedKg).toLocaleString()} kg CO₂.`,
      priority: a.paybackYears !== null && a.paybackYears <= 8 ? 'high' : 'medium',
      estimatedCost: a.installationCost,
      currency,
      impact: {
        annualSavings: a.annualSavings,
        paybackYears: a.paybackYears ?? undefined,
        annualCo2AvoidedKg: a.annualCo2AvoidedKg,
      },
      derivedFrom: ['solar.assessment'],
    })
  }

  // ── Water ────────────────────────────────────────────────────────────────
  if (bundle.water && bundle.water.assessment.demandCoverageRatio > 0.05) {
    const a = bundle.water.assessment
    recommendations.push({
      id: 'rainwater-harvesting',
      category: 'water',
      title: `Add ${Math.round(a.recommendedStorageLiters).toLocaleString()} L rainwater storage`,
      rationale:
        `Your roof can harvest ${Math.round(a.annualHarvestLiters).toLocaleString()} L/yr, meeting ` +
        `${Math.round(a.demandCoverageRatio * 100)}% of demand and saving ${formatMoney(a.annualSavings, currency)}/yr.`,
      priority: a.paybackYears !== null && a.paybackYears <= 10 ? 'high' : 'medium',
      estimatedCost: a.estimatedSystemCost,
      currency,
      impact: {
        annualSavings: a.annualSavings,
        paybackYears: a.paybackYears ?? undefined,
        annualWaterSavedLiters: a.annualHarvestLiters,
      },
      derivedFrom: ['water.assessment'],
    })
  }

  // ── Efficiency measures ──────────────────────────────────────────────────
  if (bundle.efficiency) {
    for (const measure of bundle.efficiency.measures) {
      recommendations.push({
        id: `efficiency-${measure.id}`,
        category: 'efficiency',
        title: measure.label,
        rationale:
          `Saves ${Math.round(measure.annualSavingsKwh).toLocaleString()} kWh/yr (${formatMoney(Math.round(measure.annualSavingsKwh * bundle.tariffPerKwh), currency)}/yr)` +
          `${measure.paybackYears !== null ? ` with a ${measure.paybackYears}-year payback.` : '.'}`,
        priority: measure.paybackYears !== null && measure.paybackYears <= 5 ? 'high' : measure.paybackYears !== null && measure.paybackYears <= 12 ? 'medium' : 'low',
        estimatedCost: measure.cost,
        currency,
        impact: {
          annualSavings: Math.round(measure.annualSavingsKwh * bundle.tariffPerKwh),
          paybackYears: measure.paybackYears ?? undefined,
        },
        derivedFrom: [`efficiency.measures.${measure.id}`],
      })
    }
  }

  // ── Waste ────────────────────────────────────────────────────────────────
  if (bundle.waste) {
    for (const opportunity of bundle.waste.opportunities) {
      if (opportunity.alreadyAdopted) continue
      recommendations.push({
        id: `waste-${opportunity.id}`,
        category: 'waste',
        title: opportunity.label,
        rationale:
          `Diverts up to ${Math.round(opportunity.annualCo2AvoidedKg / WASTE.LANDFILL_CO2_PER_KG).toLocaleString()} kg of waste from landfill per year, ` +
          `avoiding ${Math.round(opportunity.annualCo2AvoidedKg).toLocaleString()} kg CO₂.`,
        priority: opportunity.annualCo2AvoidedKg > 300 ? 'high' : 'medium',
        estimatedCost: opportunity.id === 'composting' ? WASTE.COMPOST_BIN_COST : 0,
        currency,
        impact: { annualCo2AvoidedKg: opportunity.annualCo2AvoidedKg },
        derivedFrom: [`waste.opportunities.${opportunity.id}`],
      })
    }
  }

  return recommendations
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}
