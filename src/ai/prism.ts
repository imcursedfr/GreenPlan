import { onAiCall, type AiCallLog } from './client'

/**
 * ── PRISM tracing adapter ──────────────────────────────────────────────────
 *
 * Forwards every existing `AiCallLog` (produced once per real AI invocation
 * inside `runAiTask()`) to PRISM over the local dev-server proxy at
 * `/api/prism/trace` (see `vite.config.ts`).
 *
 * Design rules (from the PRISM brief — do not weaken):
 *   • One PRISM trace per real model call — the sink receives exactly the
 *     `AiCallLog` objects the AI funnel already emits. No parallel AI path.
 *   • The proxy injects the PRISM credentials server-side; this browser
 *     module never sees or sends `PRISMTRACE_*` values.
 *   • PRISM is observability only: any transport failure is swallowed after a
 *     console debug. It must NEVER break a GreenPlan page or turn a
 *     successful AI call into a user-facing error.
 *
 * Session semantics:
 *   `session_id` = one GreenPlan browser session (stable per tab, sessionStorage)
 *   `request_id` = one individual AI call (already unique per `AiCallLog`)
 */

const SESSION_STORAGE_KEY = 'shp.prism.session.v1'

function getPrismSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (existing) return existing
    const created =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
    sessionStorage.setItem(SESSION_STORAGE_KEY, created)
    return created
  } catch {
    return 'sess_unavailable'
  }
}

/**
 * The trace payload mirrored on the wire. Fields follow PRISM's HTTP
 * ingestion contract (`POST {PRISMTRACE_HOST}/api/traces`, authenticated by
 * the proxy via `X-PRISMtrace-Key`): `input_messages[]`, string
 * `output_message`, `latency_ms`. GreenPlan-specific context (task, surface,
 * error, deterministic-facts provenance) rides in `metadata`. Contains
 * calculation facts and AI input/output only — never API keys, Supabase
 * secrets or auth tokens.
 */
export interface PrismTracePayload {
  project_id?: string
  request_id: string
  session_id: string
  task: AiCallLog['task']
  model: string
  input_messages: Array<{ role: 'system' | 'user'; content: string }>
  output_message: string
  status: AiCallLog['status']
  latency_ms: number
  timestamp: string
  metadata?: Record<string, unknown>
}

function toPayload(log: AiCallLog, sessionId: string): PrismTracePayload {
  return {
    request_id: log.requestId,
    session_id: sessionId,
    task: log.task,
    model: log.model,
    input_messages: [
      { role: 'system', content: log.input.system },
      { role: 'user', content: log.input.prompt },
    ],
    output_message: log.output?.text ?? '',
    status: log.status,
    latency_ms: log.durationMs,
    timestamp: log.timestamp,
    metadata: {
      app: 'GreenPlan',
      task: log.task,
      surface: log.surface,
      error: log.error,
    },
  }
}

/**
 * Register the PRISM forwarding sink. Call once at app startup
 * (`src/main.tsx`). Returns the unregister function for tests.
 */
export function initPrismTracing(): () => void {
  return onAiCall((log) => {
    const payload = toPayload(log, getPrismSessionId())
    // keepalive: the trace can outlive the page on quick navigations.
    fetch('/api/prism/trace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) {
          // Non-fatal by design — log for developer visibility only.
          console.debug(`[prism] trace not accepted (HTTP ${response.status})`)
        }
      })
      .catch(() => {
        // PRISM unreachable → tracing fails safely, GreenPlan continues.
        console.debug('[prism] trace transport failed (non-fatal)')
      })
  })
}
