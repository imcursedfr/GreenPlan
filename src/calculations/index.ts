/**
 * Deterministic calculation layer.
 *
 * RULE: all numerical sustainability results come from these modules —
 * never from the LLM. The AI layer receives finished assessments and only
 * explains/personalizes them (see src/ai).
 */
export {
  calculateSolar,
  canCalculateSolar,
  type SolarCalculationContext,
  type SolarCalculationResult,
} from './solar'
export {
  calculateWater,
  canCalculateWater,
  type WaterCalculationContext,
  type WaterCalculationResult,
} from './water'
export {
  calculateEfficiency,
  canCalculateEfficiency,
  type EfficiencyCalculationContext,
  type EfficiencyCalculationResult,
} from './efficiency'
export {
  calculateWaste,
  canCalculateWaste,
  type WasteCalculationContext,
  type WasteCalculationResult,
} from './waste'
export { assessProfile, type AssessmentBundle } from './sustainability'
export { buildRecommendations } from './recommendations'
