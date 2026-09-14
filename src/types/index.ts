/**
 * Shared domain types for Sustainable Home Planner.
 *
 * These are the single source of truth shared by the calculation layer, the
 * AI layer, services, and UI. Keep them additive and extensible — V2 will
 * tighten validation (zod-style or via deterministic validators) without
 * changing their shape.
 */

// ── Home profile ────────────────────────────────────────────────────────────

export type ClimateZone =
  | 'tropical'
  | 'arid'
  | 'temperate'
  | 'continental'
  | 'polar'

export type RoofType = 'flat' | 'gable' | 'hip' | 'shed' | 'unknown'

export type RoofOrientation =
  | 'south'
  | 'southeast'
  | 'southwest'
  | 'east'
  | 'west'
  | 'north'
  | 'flat'
  | 'unknown'

export type CoolingUsageLevel = 'none' | 'low' | 'moderate' | 'high'

/** Sustainability measures the household already has in place. */
export type ExistingMeasure =
  | 'rooftop-solar'
  | 'attic-insulation'
  | 'double-glazing'
  | 'efficient-ac'
  | 'smart-thermostat'
  | 'led-lighting'
  | 'rainwater-tank'
  | 'composting'
  | 'recycling-program'

export interface HomeProfile {
  /** User-facing label, e.g. "Our house in Austin". */
  name?: string
  /** City / region label shown in the UI. */
  locationLabel?: string
  /** The original text the user typed before geocoding resolved it. */
  locationRawQuery?: string
  /** Geographic coordinates — ALWAYS from a real geocoding API, never AI. */
  latitude?: number
  longitude?: number
  /** Structured geocoding results (from the geocoding service). */
  geocodedCountry?: string
  geocodedCountryCode?: string
  geocodedState?: string
  geocodedCity?: string
  geocodedPostcode?: string
  /** Display region derived from geocoding (drives currency/units). */
  regionCode?: 'IN' | 'US' | 'GB' | 'EU' | 'DEFAULT'
  /** Conditioned floor area in square meters. */
  floorAreaSqm?: number
  /** Number of occupants. */
  householdSize?: number
  /** Usable roof area in square meters. */
  roofAreaSqm?: number
  roofType?: RoofType
  /** Dominant roof orientation — affects solar yield. */
  roofOrientation?: RoofOrientation
  climateZone?: ClimateZone
  constructionYear?: number
  /** Air-conditioning / cooling intensity. */
  coolingUsageLevel?: CoolingUsageLevel
  /** Measures already adopted (skipped or credited by the engine). */
  existingMeasures?: ExistingMeasure[]
  /** Approximate budget the user is willing to invest (canonical currency). */
  sustainabilityBudget?: number
  budgetCurrency?: string
  /** Free-form characteristics (shading, pool, EV…). */
  notes?: string
}

// ── Energy & water usage profiles ───────────────────────────────────────────

export interface EnergyProfile {
  /** Monthly grid electricity consumption in kWh. */
  monthlyElectricityKwh?: number
  /** Monthly electricity spend in the local currency. */
  monthlyBillAmount?: number
  currency?: string
  /** True if the home uses gas or other fuels for heating/cooking. */
  hasGasConnection?: boolean
  /** EV charging adds significant load — flagged for solar sizing later. */
  ownsElectricVehicle?: boolean
}

export interface WaterProfile {
  /** Monthly municipal water consumption in cubic meters. */
  monthlyWaterM3?: number
  /** Monthly water spend. */
  monthlyWaterBillAmount?: number
  currency?: string
  /** Garden / lawn irrigation indicates rainwater-harvesting upside. */
  hasGarden?: boolean
  /** Existing storage capacity in liters (tanks, cisterns). */
  existingStorageLiters?: number
}

// ── Deterministic assessment outputs (produced by src/calculations) ────────

export interface SolarAssessment {
  /** Estimated installable array size in kWp. */
  systemSizeKwp: number
  /** Estimated annual generation in kWh. */
  annualGenerationKwh: number
  /** Estimated installation cost before incentives. */
  installationCost: number
  currency: string
  /** Annual electricity bill savings. */
  annualSavings: number
  /** Simple payback in years; null when savings are zero. */
  paybackYears: number | null
  /** Annual CO2 avoided in kg. */
  annualCo2AvoidedKg: number
  /** Share of consumption the array is expected to cover, 0–1. */
  coverageRatio: number
  /** Roof suitability 0–100 (fill ratio, orientation, consumption match). */
  roofSuitabilityScore: number
}

export interface WaterAssessment {
  /** Rainwater harvestable per year in liters. */
  annualHarvestLiters: number
  /** Recommended storage size in liters. */
  recommendedStorageLiters: number
  estimatedSystemCost: number
  currency: string
  /** Annual municipal water savings. */
  annualSavings: number
  /** Simple payback in years; null when savings are zero. */
  paybackYears: number | null
  /** Share of water demand potentially met, 0–1. */
  demandCoverageRatio: number
}

export interface EfficiencyAssessment {
  /** Estimated annual energy that efficiency measures can save, kWh. */
  annualEnergySavingsKwh: number
  estimatedCost: number
  currency: string
  annualSavings: number
  /** Simple payback in years; null when savings are zero. */
  paybackYears: number | null
  /** Indicative efficiency grade A–G, refined by the calculation engine. */
  grade?: 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
}

export interface WasteAssessment {
  /** Estimated annual household waste in kg. */
  annualWasteKg: number
  /** Share divertible from landfill through recycling/composting, 0–1. */
  diversionPotential: number
  /** Annual CO2 avoided through diversion, kg. */
  annualCo2AvoidedKg: number
}

// ── Recommendations ─────────────────────────────────────────────────────────

export type RecommendationCategory = 'solar' | 'water' | 'efficiency' | 'waste'

export type RecommendationPriority = 'high' | 'medium' | 'low'

export interface RecommendationImpact {
  annualSavings?: number
  paybackYears?: number
  annualCo2AvoidedKg?: number
  /** Liters of water saved per year, where relevant. */
  annualWaterSavedLiters?: number
}

export interface Recommendation {
  id: string
  category: RecommendationCategory
  title: string
  /** Why this matters *for this home* — grounded in calculated numbers. */
  rationale: string
  priority: RecommendationPriority
  estimatedCost?: number
  currency?: string
  impact?: RecommendationImpact
  /** Deterministic results this recommendation references (traceability). */
  derivedFrom?: string[]
}

// ── Sustainability score ────────────────────────────────────────────────────

export interface SustainabilityScore {
  /** Overall score 0–100; null when too little data exists. */
  overall: number | null
  /** Per-module 0–100; null when that module lacked input data. */
  breakdown: {
    solar: number | null
    water: number | null
    efficiency: number | null
    waste: number | null
  }
  /** Short, human-readable interpretation generated deterministically. */
  summary?: string
}

// ── AI layer contracts ──────────────────────────────────────────────────────

export type AiTaskType =
  | 'personalize-recommendations'
  | 'explain-assessment'
  | 'roadmap'

export interface AiRequestContext {
  /** Correlates AI calls with an assessment session (PRISM will use this). */
  sessionId?: string
  /** Stable identifier for the calling surface, e.g. 'planner-page'. */
  surface?: string
}

/** Structured payload every AI call must return; never raw free-form text. */
export interface AiResult<T> {
  data: T
  /** Reference id assigned by the centralized AI service for observability. */
  requestId: string
  /** Duration of the AI round trip in milliseconds. */
  durationMs: number
}
