import { useCallback, useEffect, useState } from 'react'
import {
  CalendarClock,
  Coins,
  Home,
  Leaf,
  LogOut,
  MapPin,
  Route as RouteIcon,
  Trash2,
  UserCircle2,
} from 'lucide-react'
import { PageShell } from '../components/layout/PageShell'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/feedback/EmptyState'
import { AuthForm } from '../components/auth/AuthForm'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { planService, type SavedPlan } from '../services/planService'
import { formatCurrency, formatNumber } from '../lib/format'
import type { PlannerProfile } from '../types/profile'

/** /account — home profile, saved GreenPlans, progress and auth. */
export default function AccountPage() {
  const { user, available, signOut } = useAuth()
  const { profile } = useProfile()
  const [plans, setPlans] = useState<SavedPlan[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      setPlans(await planService.listPlans(user?.id ?? null))
    } catch (error) {
      console.error('[account] failed to list plans', error)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const removePlan = async (planId: string) => {
    await planService.deletePlan(planId, user?.id ?? null)
    void refresh()
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Account"
        eyebrowIcon={UserCircle2}
        title={user ? 'Your GreenPlan account' : 'My GreenPlans'}
        description={
          user
            ? 'Your saved home profile, plans and progress.'
            : 'Explore freely — sign in only when you want to save your profile and plans across visits.'
        }
        actions={
          user ? (
            <Button variant="secondary" leftIcon={<LogOut className="size-4" aria-hidden />} onClick={() => void signOut()}>
              Sign out
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Home profile summary */}
        <Card className="lg:col-span-2">
          <CardHeader
            icon={Home}
            tone="brand"
            title="Home profile"
            description={profile ? `Last updated ${new Date(profile.updatedAt).toLocaleDateString()}` : 'Not set up yet'}
            action={
              <Button to="/onboarding" size="sm" variant="secondary">
                {profile ? 'Edit' : 'Set up'}
              </Button>
            }
          />
          <CardContent>
            {profile ? <ProfileSummary profile={profile} /> : (
              <EmptyState
                icon={Home}
                title="No home profile yet"
                description="Complete the two-minute setup to personalize every analysis."
                action={<Button to="/onboarding">Build my home profile</Button>}
                className="border-0 bg-transparent py-8"
              />
            )}
          </CardContent>
        </Card>

        {/* Auth panel */}
        <Card>
          <CardHeader
            icon={UserCircle2}
            tone="neutral"
            title={user ? 'Signed in' : 'Save your plans'}
            description={user ? user.email ?? '' : 'Optional — for saving across devices.'}
          />
          <CardContent>
            {!available ? (
              <p className="rounded-xl bg-surface-muted p-3.5 text-xs leading-relaxed text-text-muted">
                Accounts need Supabase credentials (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
                Until then your data stays in this browser — everything else works.
              </p>
            ) : user ? (
              <div className="space-y-3 text-sm text-text-body">
                <p className="flex items-center gap-2">
                  <Badge tone="brand">Active</Badge>
                  {user.email}
                </p>
                <p className="text-xs leading-relaxed text-text-muted">
                  Your profile and plans save to your account automatically when you update them.
                </p>
              </div>
            ) : (
              <AuthForm compact onSuccess={() => void refresh()} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Saved plans */}
      <div className="mt-10">
        <h2 className="mb-4 font-display text-lg font-bold text-text-strong">My GreenPlans</h2>
        {loading ? (
          <p className="py-8 text-center text-sm text-text-muted">Loading plans…</p>
        ) : plans.length === 0 ? (
          <EmptyState
            icon={RouteIcon}
            title="No saved plans yet"
            description="Open the planner and save your roadmap — it keeps your recommendations, progress and dates together."
            action={<Button to="/planner">Open the planner</Button>}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const completed = plan.actions.filter((action) => action.status === 'completed').length
              const percent = plan.actions.length > 0 ? Math.round((completed / plan.actions.length) * 100) : 0
              return (
                <Card key={plan.id} hover className="flex flex-col p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex size-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
                      <Leaf className="size-4.5" aria-hidden />
                    </span>
                    <button
                      type="button"
                      onClick={() => void removePlan(plan.id)}
                      aria-label={`Delete ${plan.name}`}
                      className="rounded-lg p-1.5 text-text-faint transition-colors hover:bg-surface-hover hover:text-text-strong"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                  <h3 className="mt-3 font-semibold text-text-strong">{plan.name}</h3>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-text-faint">
                    <CalendarClock className="size-3" aria-hidden />
                    Created {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                  <div className="mt-3 flex-1">
                    <div className="flex justify-between text-xs text-text-muted">
                      <span>Progress</span>
                      <span>{completed}/{plan.actions.length} · {percent}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                      <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-body">
                    <span className="inline-flex items-center gap-1">
                      <Coins className="size-3.5 text-text-faint" aria-hidden />
                      {formatCurrency(plan.totals.investment, plan.profile.energy.currency)}
                    </span>
                    <span>{formatCurrency(plan.totals.annualSavings, plan.profile.energy.currency)}/yr</span>
                    <span>{formatNumber(plan.totals.annualCo2AvoidedKg, 0)} kg CO₂/yr</span>
                  </div>
                  <Button to="/planner" size="sm" variant="secondary" className="mt-4">
                    Open plan
                  </Button>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </PageShell>
  )
}

function ProfileSummary({ profile }: { profile: PlannerProfile }) {
  const { home, energy, water } = profile
  return (
    <dl className="grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
      {[
        { label: 'Location', value: home.locationLabel ?? home.climateZone ?? '—', icon: MapPin },
        { label: 'Floor area', value: home.floorAreaSqm ? `${home.floorAreaSqm} m²` : '—' },
        { label: 'Household', value: home.householdSize ? `${home.householdSize} people` : '—' },
        { label: 'Roof', value: home.roofAreaSqm ? `${home.roofAreaSqm} m² (${home.roofOrientation ?? 'orientation unknown'})` : '—' },
        { label: 'Electricity', value: energy.monthlyElectricityKwh ? `${energy.monthlyElectricityKwh} kWh/mo` : energy.monthlyBillAmount !== undefined ? `${formatCurrency(energy.monthlyBillAmount, energy.currency)}/mo bill` : '—' },
        { label: 'Water', value: water.monthlyWaterM3 ? `${water.monthlyWaterM3} m³/mo` : '—' },
        { label: 'Cooling', value: home.coolingUsageLevel ?? '—' },
        { label: 'Budget', value: home.sustainabilityBudget !== undefined ? formatCurrency(home.sustainabilityBudget, energy.currency) : '—' },
      ].map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-4 border-b border-border-base/60 pb-2 last:border-0">
          <dt className="text-text-muted">{item.label}</dt>
          <dd className="text-right font-medium text-text-strong">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
