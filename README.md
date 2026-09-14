# GreenPlan

**Smarter choices for a more sustainable home.**

GreenPlan analyzes your home for solar, water, efficiency and waste opportunities with
auditable deterministic math, then uses AI to personalize and explain the results — never
to invent numbers. Guests can explore everything; accounts exist only to save plans.

**Status: Step 3 (GreenPlan MVP)** — end-to-end flow works guest-first: onboarding wizard →
deterministic engines → AI insight layer → dashboard/module pages/planner with progress
tracking, Supabase Auth for saving, and a 6-theme design system. PRISM is NOT integrated
yet; the `AiCallLog` / `onAiCall()` sink architecture is in place for it.

## Architecture

```
UI (React + Tailwind + GSAP)
  → src/services          data access (Supabase) — never called from components directly
  → src/calculations      deterministic math: ALL numbers (costs, savings, payback, CO₂)
  → src/ai                the ONLY module allowed to call a language model
      → Vercel AI SDK     generateText today; generateObject + validation in V2
      → gateway           OpenAI-compatible endpoint (VITE_AI_BASE_URL)
  → src/types             shared domain contracts (HomeProfile, assessments, …)
```

**Core rule:** the LLM is never the source of truth for numbers. Deterministic code
computes every figure; AI only explains and personalizes validated results. This is what
makes the upcoming PRISM evaluation (V1: raw AI → V2: calculations + constraints + AI)
a fair comparison.

## Stack

| Layer      | Tech                                                        |
| ---------- | ----------------------------------------------------------- |
| Frontend   | React 19, Vite 7, TypeScript 5, Tailwind CSS 4, GSAP, React Router 7 |
| UI         | Lucide React icons, Recharts (charts, wired up later), Leaflet + OpenStreetMap (location picker, later) |
| Data       | Supabase (PostgreSQL) via `@supabase/supabase-js`            |
| AI         | Vercel AI SDK 5 (`ai` + `@ai-sdk/openai-compatible`)         |
| Deployment | Vercel (SPA rewrites configured in `vercel.json`)            |
| Evaluation | Block Convey PRISM (later — not integrated yet)              |

## Getting started

```bash
npm install
cp .env.example .env   # optional — the app runs fully in demo mode without it
npm run dev            # http://localhost:5173
```

Without Supabase credentials the profile/plans persist to localStorage (demo mode, shown in
the UI) and auth is hidden — the product is fully usable as a guest. Without
`VITE_AI_BASE_URL` the AI insight cards show a graceful deterministic fallback
("AI personalization is unavailable right now. Showing your calculated GreenPlan.").

Other scripts: `npm run build` (typecheck + production build), `npm run preview`,
`npm run typecheck`.

## Environment variables

All `VITE_*` variables are public by design (inlined into the browser bundle).
Never put private secrets in them.

| Variable                 | Used by          | Notes                                                        |
| ------------------------ | ---------------- | ------------------------------------------------------------ |
| `VITE_SUPABASE_URL`      | `src/services`   | Enables auth + saving; app runs without it (local mode)      |
| `VITE_SUPABASE_ANON_KEY` | `src/services`   | Anon key — safe client-side as long as RLS is enabled        |
| `VITE_AI_BASE_URL`       | `src/ai`         | OpenAI-compatible gateway; point it at a server you control  |
| `VITE_AI_MODEL`          | `src/ai`         | Model id (default: `gpt-4o-mini`)                            |
| `VITE_AI_API_KEY`        | `src/ai`         | Optional gateway token; keep real provider keys server-side  |

## Accounts & saving (guest-first)

**Explore freely. Save when you're ready.**

- Every module, the planner and the dashboard work without an account.
- Completing onboarding saves your profile locally; progress persists in this browser.
- Signing in (Supabase Auth) saves your home profile and GreenPlans to Postgres and
  syncs them across devices.
- Apply `supabase/schema.sql` (tables `home_plans` + `green_plans`, RLS enforced) and
  enable Email auth in the Supabase dashboard to activate saving.

## Project structure

```
src/
├── ai/               centralized AI service (client.ts is the single funnel)
│                     + insights.ts: structured module/planner/location insights with validation
├── calculations/     deterministic engine skeletons: solar, water, efficiency, waste, sustainability
├── components/
│   ├── feedback/     LoadingState, RouteFallback, EmptyState
│   ├── layout/       PageShell
│   └── ui/           Button, Card, Badge, MetricCard, DashboardCard,
│                     RecommendationCard, PageHeader, Navbar, SectionContainer
├── hooks/            useGsapReveal (respectful GSAP entrance animations)
├── layouts/          LandingLayout (marketing), AppLayout (sidebar product area)
├── lib/              env, cx, format, accents, ids
├── pages/            Landing, Onboarding, Dashboard, Solar, Water, Efficiency, Waste, Planner, Account
├── sections/         landing page sections (Hero, Modules, HowItWorks, CTA)
├── services/         supabaseClient (lazy singleton), authService, profileService, planService
├── styles/           Tailwind v4 theme tokens + utilities
└── types/            shared domain types
```

## Themes

Six themes share one token set in `src/styles/index.css`; components never hardcode
colors. Switch via the navbar control (persisted in localStorage, `shp.theme`):

**System** (default, follows OS) · **Terra** (warm earth) · **Ocean** (coastal
climate-tech) · **Forest** (deep natural) · **Solar** (bright renewable) · **Midnight**
(premium dark). Recharts visualizations read themed CSS variables at render time via
`useChartPalette()`, so charts re-theme automatically.

## Deterministic engines

All numbers come from `src/calculations/` with documented constants in
`src/data/constants.ts` (peak-sun-hours, rainfall, tariffs, measure savings, emission
factors). `assessProfile()` runs every engine and reports `missing` modules instead of
inventing data; the overall score is `null` below two modules of input. Verified by
smoke test: 160 m² Austin home → 5.68 kWp array, 9,595 kWh/yr, $7,952 cost, 4.4-yr
payback.

## PRISM readiness (not integrated yet)

The architecture is prepared — nothing about PRISM is faked:

1. **Centralized AI calls.** Every model call flows through `runAiTask()` in
   `src/ai/client.ts`. Components import from `src/ai` only.
2. **Capturable I/O.** Each call already produces an `AiCallLog` (input, output, model,
   latency, status, timestamp) fanned out via `onAiCall()` sinks — a PRISM adapter plugs
   in as just another sink.
3. **Correlation ids.** Every call carries a `requestId`; session/surface context exists
   in `AiRequestContext` for grouping test-case runs.
4. **No frontend rewrite needed.** PRISM evaluation can attach at the funnel or run
   server-side without touching UI code.

## What comes next

1. Onboarding wizard (Leaflet location picker + home/usage forms → `HomeProfile`)
2. Implement the deterministic calculation engines with reviewed constants in `src/data/`
3. Supabase schema + RLS (homes, energy/water profiles, assessments, recommendations)
4. Wire assessments into dashboard/module pages (Recharts visualizations)
5. V1 AI advisor through the existing funnel → run PRISM baseline
6. V2: constraint validation before/after AI → re-run the same PRISM test cases
