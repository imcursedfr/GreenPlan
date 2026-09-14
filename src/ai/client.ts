import { generateText, type LanguageModel } from 'ai'
import { createOpenAICompatible } from '@ai-sdk/openai-compatible'
import { env } from '../lib/env'
import { newRequestId } from '../lib/ids'
import type { AiRequestContext, AiResult, AiTaskType } from '../types'

/**
 * ── Centralized AI service ─────────────────────────────────────────────────
 *
 * This module is the ONLY place in the application allowed to talk to a
 * language model. React components and services must import AI capabilities
 * from `src/ai` (the barrel) — never call the SDK directly.
 *
 * Call flow (today and after PRISM):
 *
 *   UI / services
 *     → runAiTask()          ← instrumented funnel (this file)
 *       → Vercel AI SDK      (`generateText` today, `generateObject` in V2)
 *         → OpenAI-compatible gateway → model
 *
 * PRISM READINESS (nothing fake is produced here):
 *   • Every call gets a `requestId` and optional session/surface context.
 *   • Inputs, outputs, model id, latency and errors are assembled into an
 *     `AiCallLog` and fanned out to registered sinks via `onAiCall()`.
 *   • The future PRISM adapter is just another sink (or a server-side
 *     forwarder) — the UI never changes when PRISM arrives.
 *
 * SECURITY NOTE:
 *   `VITE_*` variables are public. Point `VITE_AI_BASE_URL` at a gateway you
 *   control (a serverless function on Vercel in V2) so the real provider key
 *   stays server-side. This client only ever holds a gateway-level token.
 */

export interface AiCallLog {
  requestId: string
  task: AiTaskType
  /** e.g. "openai-compatible:gpt-4o-mini" */
  model: string
  sessionId?: string
  surface?: string
  input: { system: string; prompt: string }
  output?: { text: string }
  error?: string
  status: 'ok' | 'error'
  durationMs: number
  /** ISO timestamp — captured for later PRISM analysis. */
  timestamp: string
}

type AiCallSink = (log: AiCallLog) => void

const sinks = new Set<AiCallSink>()

/** Register a sink that receives every AI call log (PRISM hooks in here). */
export function onAiCall(sink: AiCallSink): () => void {
  sinks.add(sink)
  return () => {
    sinks.delete(sink)
  }
}

function emit(log: AiCallLog): void {
  for (const sink of sinks) {
    try {
      sink(log)
    } catch {
      // A broken observer must never break the application.
    }
  }
}

const DEFAULT_AI_MODEL = 'gpt-4o-mini'

function getGatewayModel(): LanguageModel {
  const baseURL = env.aiBaseUrl
  if (!baseURL) {
    throw new Error(
      '[ai] Missing VITE_AI_BASE_URL. The AI layer talks to an ' +
        'OpenAI-compatible gateway via the Vercel AI SDK — set VITE_AI_BASE_URL ' +
        '(and optionally VITE_AI_MODEL / VITE_AI_API_KEY) in your .env.',
    )
  }
  const modelId = env.aiModel ?? DEFAULT_AI_MODEL
  const provider = createOpenAICompatible({
    name: 'shp-gateway',
    baseURL,
    apiKey: env.aiApiKey ?? 'gateway-managed',
  })
  return provider(modelId)
}

export interface RunAiTaskOptions<TResult> {
  /** Which product task this call belongs to (correlates PRISM eval runs). */
  task: AiTaskType
  system: string
  prompt: string
  context?: AiRequestContext
  /**
   * Turn the model's text into typed data. V2 replaces this with strict
   * schema validation (`generateObject`) plus the constraint validator that
   * runs BEFORE the model sees anything and AFTER it responds.
   */
  parse: (text: string) => TResult
}

/** The single funnel through which every AI call in the app flows. */
export async function runAiTask<TResult>(options: RunAiTaskOptions<TResult>): Promise<AiResult<TResult>> {
  const requestId = newRequestId()
  const startedAt = Date.now()
  const model = getGatewayModel()
  const modelLabel = `shp-gateway:${env.aiModel ?? DEFAULT_AI_MODEL}`

  try {
    const { text } = await generateText({
      model,
      system: options.system,
      prompt: options.prompt,
    })
    const durationMs = Date.now() - startedAt

    emit({
      requestId,
      task: options.task,
      model: modelLabel,
      sessionId: options.context?.sessionId,
      surface: options.context?.surface,
      input: { system: options.system, prompt: options.prompt },
      output: { text },
      status: 'ok',
      durationMs,
      timestamp: new Date().toISOString(),
    })

    return { data: options.parse(text), requestId, durationMs }
  } catch (error) {
    const durationMs = Date.now() - startedAt

    emit({
      requestId,
      task: options.task,
      model: modelLabel,
      sessionId: options.context?.sessionId,
      surface: options.context?.surface,
      input: { system: options.system, prompt: options.prompt },
      error: error instanceof Error ? error.message : String(error),
      status: 'error',
      durationMs,
      timestamp: new Date().toISOString(),
    })

    throw error
  }
}
