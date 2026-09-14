/**
 * Public surface of the AI layer.
 *
 * Rule: the rest of the app imports AI capabilities from `@/ai` and nothing
 * else. That single choke point is where PRISM instrumentation will attach.
 */
export { runAiTask, onAiCall, type AiCallLog, type RunAiTaskOptions } from './client'
export {
  personalizeRecommendations,
  explainAssessment,
  buildRoadmapPlan,
  type PersonalizeRecommendationsInput,
  type PersonalizedRecommendation,
  type ExplainAssessmentInput,
  type RoadmapInput,
  type RoadmapPhase,
} from './tasks'
