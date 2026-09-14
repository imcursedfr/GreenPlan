import type { Recommendation, SustainabilityScore } from '../types'
import type { AiRequestContext, AiResult } from '../types'
import { runAiTask } from './client'

/**
 * Typed AI tasks.
 *
 * Each task declares its system prompt and output shape. In Step 1 these
 * wrappers exist so the contract is fixed and testable; the planner UI wires
 * them up in a later step. They never invent numbers: system prompts are
 * written to consume DETERMINISTIC results from `src/calculations` and are
 * forbidden from producing their own figures — the V2 constraint validator
 * will enforce this mechanically.
 */

export interface PersonalizeRecommendationsInput {
  /** Compact, human-readable summary of the home profile. */
  homeSummary: string
  /** Deterministic assessment results, e.g. the SolarAssessment values. */
  calculationSummary: string
  /** Hard constraints the output must respect (budget, rental, HOA…). */
  constraints: string[]
}

export interface PersonalizedRecommendation {
  id: string
  title: string
  rationale: string
  /** Which deterministic figures this claim references (traceability). */
  references: string[]
}

export function personalizeRecommendations(
  input: PersonalizeRecommendationsInput,
  context?: AiRequestContext,
): Promise<AiResult<PersonalizedRecommendation[]>> {
  return runAiTask<PersonalizedRecommendation[]>({
    task: 'personalize-recommendations',
    system: [
      'You are a home sustainability advisor.',
      'You receive DETERMINISTIC calculation results produced by verified code.',
      'Use ONLY those numbers for costs, savings, payback and impact figures.',
      'Never invent or re-estimate a number. Reference the calculations you used.',
    ].join(' '),
    prompt: JSON.stringify(input, null, 2),
    context,
    parse: (text) => JSON.parse(text) as PersonalizedRecommendation[],
  })
}

export interface ExplainAssessmentInput {
  /** The deterministic assessment to explain (solar, water, efficiency…). */
  assessmentKind: 'solar' | 'water' | 'efficiency' | 'waste'
  calculationSummary: string
  audienceLevel: 'simple' | 'detailed'
}

export function explainAssessment(
  input: ExplainAssessmentInput,
  context?: AiRequestContext,
): Promise<AiResult<{ explanation: string }>> {
  return runAiTask<{ explanation: string }>({
    task: 'explain-assessment',
    system:
      'You explain sustainability assessment results to homeowners in plain ' +
      'language. Every figure you mention must come from the provided ' +
      'calculation results. Do not add new numbers.',
    prompt: JSON.stringify(input, null, 2),
    context,
    parse: (text) => JSON.parse(text) as { explanation: string },
  })
}

export interface RoadmapInput {
  score: SustainabilityScore
  recommendations: Recommendation[]
}

export interface RoadmapPhase {
  title: string
  description: string
  recommendationIds: string[]
}

/** Builds the prioritized roadmap narrative on top of validated inputs. */
export function buildRoadmapPlan(
  input: RoadmapInput,
  context?: AiRequestContext,
): Promise<AiResult<RoadmapPhase[]>> {
  return runAiTask<RoadmapPhase[]>({
    task: 'roadmap',
    system:
      'You organize sustainability recommendations into phased roadmaps. ' +
      'Only reference recommendations and numbers provided in the input. ' +
      'Do not invent new recommendations or figures.',
    prompt: JSON.stringify(input, null, 2),
    context,
    parse: (text) => JSON.parse(text) as RoadmapPhase[],
  })
}
