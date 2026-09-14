-- ── GreenPlan Supabase schema ────────────────────────────────────────────────
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- After applying, enable email auth in Authentication → Providers.

-- ── 1. home_plans: one saved home profile per user ──────────────────────────
create table if not exists public.home_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  profile jsonb not null,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.home_plans enable row level security;

drop policy if exists "Users manage own profile" on public.home_plans;
create policy "Users manage own profile"
  on public.home_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ── 2. green_plans: saved GreenPlans (roadmap snapshots + progress) ─────────
create table if not exists public.green_plans (
  id uuid primary key,                          -- client-generated (crypto.randomUUID)
  user_id uuid not null references auth.users (id) on delete cascade,
  plan jsonb not null,                          -- full SavedPlan snapshot (see src/services/planService.ts)
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists green_plans_user_idx on public.green_plans (user_id, updated_at desc);

alter table public.green_plans enable row level security;

drop policy if exists "Users manage own plans" on public.green_plans;
create policy "Users manage own plans"
  on public.green_plans
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
