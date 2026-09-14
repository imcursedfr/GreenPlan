# GreenPlan — Emergency Handoff (PRISM Stage)

Written under time pressure. Verified facts only; unknowns marked.

## 1. PROJECT

**GreenPlan** (renamed from "Sustainable Home Planner") — AI-powered sustainability planning for homeowners: solar, water, efficiency and waste analysis with deterministic math, regional currency/units, AI interpretation of engine results, and a prioritized roadmap.

**Stack**: React 19 + Vite 7 + TypeScript, Tailwind v4 (CSS-variable tokens, 6 themes), GSAP, React Router, Recharts, Lucide. Data: Supabase (optional) + localStorage fallback. AI: Vercel AI SDK (`ai` + `@ai-sdk/openai-compatible`) → Google Gemini. Deploy target: Vercel. Evaluation: Block Convey PRISM (NOT yet integrated).

**Architecture**: `UI → useAssessment() → deterministic engines (src/calculations) → buildCalculationFacts() → runAiTask() (single AI funnel) → Gemini → parseJsonLoose() → validators → AI Insight cards`. Engines are the ONLY source of numbers. AI is interpretation-only.

## 2. CURRENT STATUS

**Completed and verified:**
- Full foundation + functional MVP: landing, onboarding wizard (8 steps), 4 module pages, planner with progress tracking, dashboard (auth-gated), account page.
- Text-based location input (Nominatim autocomplete, no API key, no map). Coordinates from real API only.
- Regional system: `src/lib/region.ts` (IN/US/GB/EU), currency via FX table in `src/lib/format.ts` (`formatCurrency` converts USD-canonical → INR/GBP/EUR at display). Verified: solar costs render as ₹.
- NumberSlider: typed input + synced slider, display-unit↔canonical conversion, explicit warnings.
- Multi-homes: `src/services/homesService.ts` + `src/hooks/useHomes.tsx` + sidebar `HomeSwitcher` (create/rename/delete/switch, localStorage + Supabase).
- Auth gating: `AuthGate` wraps /dashboard and /planner; guests explore modules freely.
- Glass sidebar redesign, themed scrollbar/sliders, 6 themes intact.
- `tsc -b` and `npm run build` PASS as of handoff time.

**Previous task (interrupted):** verifying real Supabase auth end-to-end with the user's real credentials now in `.env`.

**Unfinished:**
- Live signup/login verification was IN PROGRESS when interrupted. Two findings before the stop:
  1. A real signup POST to Supabase returned **HTTP 400** with body message `Email address "greenplan.qa.914@gmail.com" is invalid`. This error text is a **Supabase server response**, not app validation — likely the Supabase project's email restrictions, or the attempt happened before Vite restarted with real keys. NEEDS RETEST after server restart.
  2. Vite WAS restarted with the real credentials (pid verified on :5173) — but the last page loads in the preview kept resetting; the auth UI kept remounting. Retest cleanly.
- AuthForm sign-up toggle was dropped during an earlier edit and was RESTORED just before the interrupt (`src/components/auth/AuthForm.tsx`, tsc clean). Not yet re-tested in browser.

## 3. SUPABASE

- Credentials: **configured in `.env`** (`VITE_SUPABASE_URL=https://iotrzsmlfafstwyonrdd.supabase.co` + anon key). Project ref: `iotrzsmlfafstwyonrdd`. NEVER print the anon key.
- `src/services/supabaseClient.ts`: `getSupabase()` is lazy/defensive, returns null when env missing/invalid → localStorage demo mode. Guest mode must keep working.
- Signup/login/session: **NOT yet verified live** (see above). Signup reached the server (400 response), so connectivity + key routing works at the network level.
- Schema: `supabase/schema.sql` covers `home_plans` + `green_plans` (JSONB, RLS). **`green_homes` table (multi-homes) is NOT in schema.sql yet** — homesService expects `green_homes(id uuid, user_id uuid, home jsonb, updated_at timestamptz)` with RLS. Add it in the dashboard/SQL editor.
- Possible manual action: if the 400 persists, check Supabase Dashboard → Authentication → Providers → Email (restrictions/blocked domains), and consider disabling "Confirm email" for the hackathon (Auth → Sign In/Providers). Also verify redirect URLs in Auth → URL Configuration include `http://localhost:5173`.

## 4. AI

- **Funnel**: `src/ai/client.ts` — `runAiTask()` is the ONLY AI entry point. Uses Vercel AI SDK `generateText` + `createOpenAICompatible`. Logs `AiCallLog` objects via `onAiCall()` sinks (PRISM hook point — PRESERVE).
- **Tasks**: `src/ai/tasks.ts`, `src/ai/insights.ts` — `moduleInsight` (solar/water/efficiency/waste), `plannerInsight`, `locationInsight`. Strict validators (`asModuleInsight`, `asPlannerInsight`, ...). `parseJsonLoose()` strips Gemini's ```json fences — DO NOT REMOVE.
- **Deterministic fallbacks**: `fallbackModuleInsight` etc. render when AI fails. Verified working (429 → fallback, no crash).
- **Configured model**: `gemini-3.6-flash` via `VITE_AI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/` (note trailing path is the OpenAI-compat route; SDK appends `/chat/completions`). `gemini-2.5-flash` is retired for new keys — do not revert.
- **Env names only**: `VITE_AI_BASE_URL`, `VITE_AI_MODEL`, `VITE_AI_API_KEY`.
- Real Gemini calls verified 200 earlier today; currently **429 free-tier rate limits** hit during rapid testing (per-minute + daily limits). Fallback handles it; wait or add credits for demo.
- AI safety: system prompts forbid inventing numbers; all figures must come verbatim from `buildCalculationFacts()`. Never loosen this.

## 5. PRISM — NEXT AGENT MUST DO

The next agent receives (separately) a PRISM setup brief with credentials. Requirements:

1. **Verify the PRISM credential** using the provided PRISM setup brief before coding.
2. **Instrument the existing Vercel AI SDK / `runAiTask()` pipeline** — do NOT create a parallel AI path. Forward each `AiCallLog` (requestId, sessionId, task, input, output, model, latency, status, timestamp) via **HTTP POST to `/api/traces`** on the PRISM host.
3. Use env vars: **`PRISMTRACE_API_KEY`**, **`PRISMTRACE_PROJECT_ID`**, **`PRISMTRACE_HOST`**. Read them server-side if possible (Vercel serverless `/api/traces`) to avoid exposing keys; if client-side, note the exposure risk in the README.
4. **NEVER commit secrets** — `.env` is gitignored; keep it that way.
5. **Add the required PRISM standing rule to the repository's agent instructions** (e.g. `.freebuff/` agent instructions or AGENT.md) exactly as the PRISM brief specifies.
6. Produce a **real LIVE CONNECTED trace** (an actual AI call visible in the PRISM dashboard), not just a handshake/200.
7. **Preserve `AiCallLog` / `onAiCall()`** — they already exist in `src/ai/client.ts`; register a forwarding sink in `main.tsx` or a serverless proxy. Do not restructure.

## 6. NEXT PRIORITIES (exact order)

A. Finish/verify Supabase auth (retest signup/login/session/profile-save after clean restart; resolve the 400 email error)
B. Finish the home-setup lock for Solar/Water/Efficiency/Waste (`useAssessment` has a completeness check; verify each module's empty state blocks personalized data without area+roof+energy)
C. Fix/verify Gemini AI rendering live (quota permitting)
D. Complete PRISM live instrumentation (`/api/traces`)
E. Run PRISM V1 → V2 evaluation with fixed test scenarios (same HomeProfile set through both flows)
F. Measure real improvement (unsupported claims, hallucinated numbers, contradictions — before vs after constraint validation)
G. Prepare 6-slide pitch

## 7. DO-NOT-BREAK RULES

- Deterministic calculations are the ONLY source of numerical facts (costs, savings, payback, CO₂, capacity).
- AI must NEVER invent costs, savings, payback, CO₂, coordinates, or facilities.
- Preserve `parseJsonLoose`, all validators, `runAiTask`, `AiCallLog`, `onAiCall`, deterministic fallbacks.
- Preserve guest/localStorage mode — app must render with zero Supabase credentials.
- Do not fake auth, data, or AI results.
- Do not redesign the app; do not replace the Vercel AI SDK; no new frameworks.
- Money stored USD-canonical; convert at display only (`src/lib/format.ts`).

## 8. FILE MAP

- **AI**: `src/ai/client.ts` (funnel + AiCallLog/onAiCall), `src/ai/tasks.ts`, `src/ai/insights.ts` (tasks, validators, parseJsonLoose, fallbacks), `src/components/ai/AiInsightCard.tsx`
- **Calculations**: `src/calculations/` (solar.ts, water.ts, efficiency.ts, waste.ts, sustainability.ts, recommendations.ts), constants: `src/data/constants.ts`
- **Auth**: `src/services/authService.ts`, `src/hooks/useAuth.tsx`, `src/components/auth/AuthForm.tsx`, `src/components/auth/AuthGate.tsx`
- **Supabase**: `src/services/supabaseClient.ts`, `src/services/profileService.ts`, `src/services/planService.ts`, `src/services/homesService.ts`, `supabase/schema.sql`
- **Onboarding/home setup**: `src/pages/OnboardingPage.tsx`, `src/components/onboarding/` (LocationSearch, NumberSlider, WizardShell, fields), `src/services/geocodingService.ts`, `src/hooks/useHomes.tsx`, `src/components/homes/HomeSwitcher.tsx`
- **Planner**: `src/pages/PlannerPage.tsx`, `src/hooks/usePlanProgress.ts`
- **Routing**: `src/routes.tsx` (AuthGate wiring), `src/layouts/AppLayout.tsx`
- **Regional/format**: `src/lib/region.ts`, `src/lib/format.ts`
- **Env config**: `src/lib/env.ts`, `.env` (secrets, gitignored), `.env.example`
- **PRISM tracing**: none yet — hook point is `src/ai/client.ts` (`onAiCall`) + future `/api/traces`

## 9. VERIFICATION

`tsc -b` — PASS (run just before writing this file). `npm run build` — PASS as of the last full run minutes ago (cosmetic chunk-size warning only). Re-run both after any change.

---

## STATUS SUMMARY

**COMPLETED**: full product foundation + MVP (onboarding, 4 modules, planner, multi-homes, regional currency/units, glass UI, 6 themes); deterministic engines untouched and verified; AI pipeline verified end-to-end (200s earlier today); graceful 429 fallback verified; tsc + build green.

**IN PROGRESS**: live Supabase auth verification (real signup hit the server, got 400 "email invalid" — retest after clean restart; check Supabase email provider settings if it persists). AuthForm signup toggle restored, untested in browser.

**NEXT AGENT MUST DO**: (1) verify auth end-to-end; (2) verify module empty-state locks; (3) verify Gemini live; (4) PRISM instrumentation via onAiCall → POST /api/traces with PRISMTRACE_* env vars + agent-instructions rule + one live trace; (5) V1→V2 evaluation; (6) metrics; (7) pitch slides.

**BUILD STATUS**: PASS (tsc -b clean; npm run build succeeds).
