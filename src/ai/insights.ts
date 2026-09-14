import type { PlannerProfile } from '../types/profile'
import type { AssessmentBundle } from '../calculations/sustainability'
import { runAiTask } from './client'

/**
 * Structured AI insight layer.
 *
 * Every task receives DETERMINISTIC calculation facts and must return
 * interpretation only. Responses are strictly validated; on any failure the
 * caller falls back to deterministic copy — the app never breaks and never
 * shows invented numbers.
 */

/**
 * Strip markdown code fences some models wrap around JSON despite
 * "respond ONLY with valid JSON" instructions (e.g. ```json ... ```).
 * A no-op for already-clean JSON.
 */
function parseJsonLoose(text: string): unknown {
  const trimmed = text.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/)
  return JSON.parse(fenced ? fenced[1] : trimmed)
}

// ── Shared structured shapes ───────────────────────────────────────────────

export interface ModuleAiInsight {
  summary: string
  whyItMatters: string[]
  priorities: string[]
  nextSteps: string[]
  considerations: string[]
}

export interface PlannerAiInsight {
  summary: string
  recommendedOrder: string[]
  quickWins: string[]
  longerTerm: string[]
  tradeoffs: string[]
}

export interface LocationAiInsight {
  summary: string
  climateNotes: string[]
  mapAnnotations: LocationMapAnnotation[]
}

/**
 * Map annotations the AI may propose. Coordinates MUST come from the
 * verified profile/geocoder data supplied in the input — the validator
 * rejects anything else, so the LLM cannot invent places.
 */
export interface LocationMapAnnotation {
  type: 'home' | 'context'
  latitude: number
  longitude: number
  title: string
  reason: string
}

// ── Validation (never trust the model) ─────────────────────────────────────

function asStringArray(value: unknown, max = 6): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .slice(0, max)
}

function asModuleInsight(data: unknown): ModuleAiInsight | null {
  if (typeof data !== 'object' || data === null) return null
  const record = data as Record<string, unknown>
  const summary = typeof record.summary === 'string' ? record.summary.trim() : ''
  if (!summary) return null
  return {
    summary,
    whyItMatters: asStringArray(record.whyItMatters),
    priorities: asStringArray(record.priorities),
    nextSteps: asStringArray(record.nextSteps),
    considerations: asStringArray(record.considerations),
  }
}

function asPlannerInsight(data: unknown): PlannerAiInsight | null {
  if (typeof data !== 'object' || data === null) return null
  const record = data as Record<string, unknown>
  const summary = typeof record.summary === 'string' ? record.summary.trim() : ''
  if (!summary) return null
  return {
    summary,
    recommendedOrder: asStringArray(record.recommendedOrder),
    quickWins: asStringArray(record.quickWins),
    longerTerm: asStringArray(record.longerTerm),
    tradeoffs: asStringArray(record.tradeoffs),
  }
}

function asLocationInsight(data: unknown, home: { latitude?: number; longitude?: number }): LocationAiInsight | null {
  if (typeof data !== 'object' || data === null) return null
  const record = data as Record<string, unknown>
  const summary = typeof record.summary === 'string' ? record.summary.trim() : ''
  if (!summary) return null

  const annotations: LocationMapAnnotation[] = []
  if (Array.isArray(record.mapAnnotations)) {
    for (const raw of record.mapAnnotations) {
      if (typeof raw !== 'object' || raw === null) continue
      const candidate = raw as Record<string, unknown>
      const title = typeof candidate.title === 'string' ? candidate.title.trim() : ''
      const reason = typeof candidate.reason === 'string' ? candidate.reason.trim() : ''
      const lat = typeof candidate.latitude === 'number' ? candidate.latitude : NaN
      const lon = typeof candidate.longitude === 'number' ? candidate.longitude : NaN
      const type = candidate.type === 'home' ? 'home' : 'context'
      // Coordinates must match the verified home position (or a tiny offset
      // for visual separation) — anything else is treated as hallucination.
      const nearHome =
        home.latitude !== undefined &&
        home.longitude !== undefined &&
        Math.abs(lat - home.latitude) < 0.05 &&
        Math.abs(lon - home.longitude) < 0.05
      if (!title || !reason || !nearHome) continue
      annotations.push({ type, latitude: lat, longitude: lon, title, reason })
    }
  }

  return { summary, climateNotes: asStringArray(record.climateNotes), mapAnnotations: annotations }
}

// ── Shared system prompt ────────────────────────────────────────────────────

const INTERPRETER_SYSTEM = [
  'You are GreenPlan\'s sustainability advisor.',
  'You receive DETERMINISTIC calculation results produced by verified code.',
  'Interpret, personalize and prioritize — never invent numbers.',
  'Every cost, saving, payback, capacity or quantity you mention MUST appear verbatim in the provided calculation facts.',
  'If a figure is not in the facts, refer to it qualitatively instead.',
  'Respond ONLY with valid JSON matching the requested shape.',
].join(' ')

// ── Module insight task ────────────────────────────────────────────────────

export type ModuleKind = 'solar' | 'water' | 'efficiency' | 'waste'

export interface ModuleInsightInput {
  module: ModuleKind
  homeSummary: string
  calculationFacts: string
}

export function moduleInsight(
  input: ModuleInsightInput,
  context?: { sessionId?: string; surface?: string },
): Promise<{ data: ModuleAiInsight | null; requestId: string; durationMs: number }> {
  return runAiTask<ModuleAiInsight | null>({
    task: 'explain-assessment',
    system: INTERPRETER_SYSTEM,
    prompt: [
      `Module: ${input.module}`,
      `Home profile: ${input.homeSummary}`,
      `DETERMINISTIC CALCULATION FACTS: ${input.calculationFacts}`,
      '',
      'Return JSON with keys: summary (2-3 sentences, personalized), whyItMatters (array), priorities (array), nextSteps (array), considerations (array of caveats/uncertainties).',
    ].join('\n'),
    context,
    parse: (text) => {
      try {
        return asModuleInsight(parseJsonLoose(text))
      } catch {
        return null
      }
    },
  })
}

// ── Planner insight task ───────────────────────────────────────────────────

export interface PlannerInsightInput {
  homeSummary: string
  calculationFacts: string
  recommendationTitles: string[]
}

export function plannerInsight(
  input: PlannerInsightInput,
  context?: { sessionId?: string; surface?: string },
): Promise<{ data: PlannerAiInsight | null; requestId: string; durationMs: number }> {
  return runAiTask<PlannerAiInsight | null>({
    task: 'roadmap',
    system: INTERPRETER_SYSTEM,
    prompt: [
      `Home profile: ${input.homeSummary}`,
      `DETERMINISTIC CALCULATION FACTS: ${input.calculationFacts}`,
      `Available recommendations (deterministic): ${input.recommendationTitles.join(' | ')}`,
      '',
      'Return JSON with keys: summary (personalized plan overview), recommendedOrder (titles from the list, best first), quickWins (titles), longerTerm (titles), tradeoffs (array of strings).',
    ].join('\n'),
    context,
    parse: (text) => {
      try {
        return asPlannerInsight(parseJsonLoose(text))
      } catch {
        return null
      }
    },
  })
}

// ── Location insight task ──────────────────────────────────────────────────

export interface LocationInsightInput {
  locationLabel: string
  latitude?: number
  longitude?: number
  climateZone?: string
  homeSummary: string
  calculationFacts: string
}

/**
 * Post-location AI assessment. Map annotations are constrained to the
 * verified home coordinates; the AI cannot introduce new places.
 */
export function locationInsight(
  input: LocationInsightInput,
  context?: { sessionId?: string; surface?: string },
): Promise<{ data: LocationAiInsight | null; requestId: string; durationMs: number }> {
  const home = { latitude: input.latitude, longitude: input.longitude }
  return runAiTask<LocationAiInsight | null>({
    task: 'explain-assessment',
    system: INTERPRETER_SYSTEM,
    prompt: [
      `Location: ${input.locationLabel} (${input.latitude?.toFixed(3) ?? 'unknown'}, ${input.longitude?.toFixed(3) ?? 'unknown'}), climate zone: ${input.climateZone ?? 'unknown'}.`,
      `Home profile: ${input.homeSummary}`,
      `DETERMINISTIC CALCULATION FACTS: ${input.calculationFacts}`,
      '',
      'Return JSON with keys: summary (how this location shapes the sustainability opportunities), climateNotes (array), mapAnnotations (array of {type, latitude, longitude, title, reason}).',
      input.latitude !== undefined && input.longitude !== undefined
        ? `For mapAnnotations you may ONLY use the verified home coordinates (${input.latitude}, ${input.longitude}) — e.g. one "home" annotation with a location-specific siting note. Never invent other coordinates or places.`
        : 'Omit mapAnnotations entirely (no verified coordinates available).',
    ].join('\n'),
    context,
    parse: (text) => {
      try {
        return asLocationInsight(parseJsonLoose(text), home)
      } catch {
        return null
      }
    },
  })
}

// ── Deterministic fallbacks (used when AI is unavailable/invalid) ──────────

export function fallbackModuleInsight(module: ModuleKind, bundle: AssessmentBundle): ModuleAiInsight {
  switch (module) {
    case 'solar': {
      const a = bundle.solar?.assessment
      return {
        summary: a
          ? `Your roof supports a ${a.systemSizeKwp} kWp array covering ${Math.round(a.coverageRatio * 100)}% of your electricity, with a ${a.paybackYears ?? '—'} year payback.`
          : 'Add roof area and electricity use to unlock the solar analysis.',
        whyItMatters: a
          ? [`Solar offsets the largest single household expense: electricity.`, `Generation of ${Math.round(a.annualGenerationKwh).toLocaleString()} kWh/yr avoids ${Math.round(a.annualCo2AvoidedKg).toLocaleString()} kg CO₂.`]
          : [],
        priorities: a ? ['Confirm roof orientation and shading for a sharper estimate'] : [],
        nextSteps: a ? ['Get 2–3 installer quotes for the recommended size', 'Check local permitting and net-metering rules'] : [],
        considerations: a ? ['Estimates assume the documented constants — actual quotes will vary'] : [],
      }
    }
    case 'water': {
      const a = bundle.water?.assessment
      return {
        summary: a
          ? `Your roof can harvest about ${Math.round(a.annualHarvestLiters).toLocaleString()} L/yr, meeting ${Math.round(a.demandCoverageRatio * 100)}% of demand.`
          : 'Add roof area and water usage to unlock the rainwater analysis.',
        whyItMatters: a ? ['Harvested water is essentially free once the system is paid off'] : [],
        priorities: a ? ['Non-potable reuse (garden, toilet) gives the fastest payoff'] : [],
        nextSteps: a ? ['Size gutters and first-flush diversion before buying a tank'] : [],
        considerations: a ? ['Rainfall varies year to year — storage buffers dry spells'] : [],
      }
    }
    case 'efficiency': {
      const a = bundle.efficiency?.assessment
      const top = bundle.efficiency?.measures[0]
      return {
        summary: a
          ? `Efficiency measures could save ${Math.round(a.annualEnergySavingsKwh).toLocaleString()} kWh/yr and lift your home to grade ${a.grade}.`
          : 'Add home size and electricity use to unlock the efficiency analysis.',
        whyItMatters: a ? ['Efficiency savings compound before any solar investment'] : [],
        priorities: top ? [`Start with ${top.label} — best payback first`] : [],
        nextSteps: a ? ['Tackle the shortest-payback measure first'] : [],
        considerations: a ? ['Savings apply sequentially to avoid double counting'] : [],
      }
    }
    case 'waste': {
      const a = bundle.waste?.assessment
      return {
        summary: a
          ? `Your household generates about ${Math.round(a.annualWasteKg).toLocaleString()} kg/yr; ${Math.round(a.diversionPotential * 100)}% is currently divertible.`
          : 'Add household size to unlock the waste analysis.',
        whyItMatters: a ? ['Composting and recycling cut landfill methane — a potent greenhouse gas'] : [],
        priorities: a ? ['Composting typically diverts the largest single share'] : [],
        nextSteps: a ? ['Set up segregation bins before adding composting'] : [],
        considerations: a ? ['Diversion estimates depend on consistent participation'] : [],
      }
    }
  }
}

export function fallbackPlannerInsight(recommendationTitles: string[]): PlannerAiInsight {
  return {
    summary: 'This roadmap is ordered deterministically from your calculated results.',
    recommendedOrder: recommendationTitles,
    quickWins: recommendationTitles.slice(0, 2),
    longerTerm: recommendationTitles.slice(2),
    tradeoffs: ['Ordering balances payback, cost and impact — see the comparison modes'],
  }
}

// Convenience: profile summary builder shared by all AI callers.
export function buildHomeSummary(profile: PlannerProfile): string {
  const { home, energy, water } = profile
  return [
    home.locationLabel && `Location: ${home.locationLabel}`,
    home.climateZone && `Climate: ${home.climateZone}`,
    home.floorAreaSqm && `Floor area: ${home.floorAreaSqm} m²`,
    home.householdSize && `Household: ${home.householdSize} people`,
    home.roofAreaSqm && `Roof: ${home.roofAreaSqm} m² (${home.roofOrientation ?? 'orientation unknown'}, ${home.roofType ?? 'type unknown'})`,
    home.coolingUsageLevel && `Cooling: ${home.coolingUsageLevel}`,
    home.existingMeasures?.length && `Existing measures: ${home.existingMeasures.join(', ')}`,
    energy.monthlyElectricityKwh && `Electricity: ${energy.monthlyElectricityKwh} kWh/mo`,
    energy.monthlyBillAmount && `Bill: ${energy.monthlyBillAmount}/mo`,
    water.monthlyWaterM3 && `Water: ${water.monthlyWaterM3} m³/mo`,
    water.hasGarden && 'Has garden',
  ]
    .filter(Boolean)
    .join('; ')
}

export function buildCalculationFacts(bundle: AssessmentBundle): string {
  const parts: string[] = []
  if (bundle.solar) {
    const a = bundle.solar.assessment
    parts.push(
      `SOLAR: ${a.systemSizeKwp} kWp; generation ${Math.round(a.annualGenerationKwh)} kWh/yr; cost ${a.installationCost}; savings ${a.annualSavings}/yr; payback ${a.paybackYears ?? 'n/a'} yr; CO2 ${a.annualCo2AvoidedKg} kg/yr; coverage ${(a.coverageRatio * 100).toFixed(0)}%; roof suitability ${a.roofSuitabilityScore}/100.`,
    )
  } else parts.push('SOLAR: insufficient input data.')
  if (bundle.water) {
    const a = bundle.water.assessment
    parts.push(
      `WATER: harvest ${Math.round(a.annualHarvestLiters)} L/yr; storage ${Math.round(a.recommendedStorageLiters)} L; cost ${a.estimatedSystemCost}; savings ${a.annualSavings}/yr; payback ${a.paybackYears ?? 'n/a'} yr; demand coverage ${(a.demandCoverageRatio * 100).toFixed(0)}%.`,
    )
  } else parts.push('WATER: insufficient input data.')
  if (bundle.efficiency) {
    const a = bundle.efficiency.assessment
    parts.push(
      `EFFICIENCY: grade ${a.grade}; savings ${Math.round(a.annualEnergySavingsKwh)} kWh/yr; cost ${a.estimatedCost}; bill savings ${a.annualSavings}/yr; payback ${a.paybackYears ?? 'n/a'} yr. Measures: ${bundle.efficiency.measures.map((m) => `${m.label} ${m.annualSavingsKwh} kWh/$${m.cost}${m.paybackYears !== null ? `/${m.paybackYears}yr` : ''}`).join('; ')}.`,
    )
  } else parts.push('EFFICIENCY: insufficient input data.')
  if (bundle.waste) {
    const a = bundle.waste.assessment
    parts.push(
      `WASTE: ${Math.round(a.annualWasteKg)} kg/yr; diversion ${(a.diversionPotential * 100).toFixed(0)}%; CO2 avoided ${a.annualCo2AvoidedKg} kg/yr.`,
    )
  } else parts.push('WASTE: insufficient input data.')
  parts.push(`SCORE: overall ${bundle.score.overall ?? 'insufficient data'}.`)
  return parts.join(' | ')
}
