# Agent instructions — GreenPlan

GreenPlan: React 19 + Vite 7 + TypeScript sustainability planner. Deterministic
engines in `src/calculations/` are the ONLY source of numbers; AI
(`src/ai/`, Vercel AI SDK → Gemini via `runAiTask()`) is interpretation-only.
Guest/localStorage mode must always keep working.

## PRISM tracing (do not remove)

This project sends traces to PRISM. Env vars: `PRISMTRACE_API_KEY`,
`PRISMTRACE_PROJECT_ID`, `PRISMTRACE_HOST`.

Tracing is currently wired at:

- `src/ai/prism.ts` — `initPrismTracing()` registers the single `onAiCall()`
  sink; it converts each `AiCallLog` to PRISM's trace contract
  (`input_messages[]`, `output_message`, `latency_ms`, `metadata`) and posts
  it to the same-origin proxy. Never throws; failures are debug-logged only.
- `src/main.tsx` — calls `initPrismTracing()` once at startup.
- `vite.config.ts` — dev/preview middleware `POST /api/prism/trace` that
  injects `X-PRISMtrace-Key` + `project_id` server-side and forwards to
  `{PRISMTRACE_HOST}/api/traces`.
- `api/prism/trace.ts` — identical Vercel serverless proxy for production.

**Standing rule.** Whenever you add or change an agent, chain, graph, tool,
retriever, or any entry point that calls a model, wire it to PRISM before you
finish. Unwired code is invisible in the dashboard. If you are unsure whether
something is covered, assume it is not and wire it. (All model traffic already
flows through `runAiTask()` → `AiCallLog` → `onAiCall()`, so new tasks that
use the funnel are covered automatically; anything that bypasses the funnel
must not exist.)

## Do-not-break rules

- Never invent numbers in AI output; facts come only from
  `buildCalculationFacts()`. Preserve `parseJsonLoose()`, strict validators,
  and deterministic fallbacks.
- Never commit `.env` or any key. `PRISMTRACE_*` are server-side only and
  must never be read into the browser bundle.
- PRISM tracing is observability: it must never break a page or turn a
  successful AI call into a user-facing error.
