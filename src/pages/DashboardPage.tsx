import { Link } from 'react-router-dom'
import {
  ArrowRight,
  CloudRain,
  Coins,
  Droplets,
  Fan,
  Info,
  Leaf,
  PiggyBank,
  Recycle,
  Sprout,
  Sun,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageShell } from '../components/layout/PageShell'
import { PageHeader } from '../components/ui/PageHeader'
import { MetricCard } from '../components/ui/MetricCard'
import { DashboardCard } from '../components/ui/DashboardCard'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { RecommendationCard } from '../components/ui/RecommendationCard'
import { EmptyState } from '../components/feedback/EmptyState'
import { Button } from '../components/ui/Button'
import { useAssessment } from '../hooks/useAssessment'
import { useCountUp } from '../hooks/useCountUp'
import { useChartPalette } from '../hooks/useChartPalette'
import { useGsapReveal } from '../hooks/useGsapReveal'
import { formatCurrency, formatNumber } from '../lib/format'
import type { LucideIcon } from 'lucide-react'
import type { AccentTone } from '../lib/accents'

/** /dashboard — the main product surface, driven by deterministic results. */
export default function DashboardPage() {
  const assessment = useAssessment()
  const reveal = useGsapReveal<HTMLElement>({ selector: '[data-reveal]', y: 18, stagger: 0.06 })

  if (!assessment) {
    return (
      <PageShell>
        <PageHeader
          eyebrow="Overview"
          eyebrowIcon={Leaf}
          title="Your sustainability dashboard"
          description="Complete the two-minute home setup to unlock your personalized plan."
        />
        <EmptyState
          icon={Leaf}
          title="No home profile yet"
          description="Tell us about your home — location, size, usage — and every number on this page will be calculated for you, deterministically."
          action={
            <Button to="/onboarding" size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
              Explore GreenPlan
            </Button>
          }
        />
      </PageShell>
    )
  }

  const { profile, bundle, recommendations } = assessment
  const palette = useChartPalette()
  const currency = profile.energy.currency ?? 'USD'

  const annualSavings =
    (bundle.solar?.assessment.annualSavings ?? 0) +
    (bundle.efficiency?.assessment.annualSavings ?? 0) +
    (bundle.water?.assessment.annualSavings ?? 0)
  const annualCo2 =
    (bundle.solar?.assessment.annualCo2AvoidedKg ?? 0) +
    (bundle.waste?.assessment.annualCo2AvoidedKg ?? 0)
  const totalInvestment = recommendations.reduce((sum, rec) => sum + (rec.estimatedCost ?? 0), 0)

  const animatedScore = useCountUp(bundle.score.overall ?? 0)
  const animatedSavings = useCountUp(annualSavings)
  const animatedCo2 = useCountUp(annualCo2)

  // ── Chart data ────────────────────────────────────────────────────────────
  interface ScoreDatum {
    key: string
    label: string
    value: number
    color: string
  }
  const scoreData: ScoreDatum[] = (
    [
      { key: 'solar', label: 'Solar', value: bundle.score.breakdown.solar, color: palette.solar },
      { key: 'water', label: 'Water', value: bundle.score.breakdown.water, color: palette.water },
      { key: 'efficiency', label: 'Efficiency', value: bundle.score.breakdown.efficiency, color: palette.efficiency },
      { key: 'waste', label: 'Waste', value: bundle.score.breakdown.waste, color: palette.waste },
    ] as ScoreDatum[]
  ).filter((entry) => entry.value !== null)

  const savingsData = [
    { source: 'Solar', value: bundle.solar?.assessment.annualSavings ?? 0 },
    { source: 'Efficiency', value: bundle.efficiency?.assessment.annualSavings ?? 0 },
    { source: 'Water', value: bundle.water?.assessment.annualSavings ?? 0 },
  ].filter((entry) => entry.value > 0)

  const priorityRecs = [...recommendations]
    .sort((a, b) => priorityWeight(a.priority) - priorityWeight(b.priority))
    .slice(0, 3)

  return (
    <PageShell>
      <article ref={reveal}>
        <PageHeader
          eyebrow={profile.home.locationLabel ?? 'Your home'}
          eyebrowIcon={profile.home.locationLabel ? undefined : Leaf}
          title="Your sustainability dashboard"
          description={bundle.score.summary ?? 'Deterministic results from your home profile.'}
          actions={
            <>
              <Button to="/onboarding" variant="secondary">
                Edit profile
              </Button>
              <Button to="/planner" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                Open planner
              </Button>
            </>
          }
        />

        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
          <Card className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text-muted">Sustainability score</p>
                {bundle.score.overall !== null ? (
                  <p className="mt-1 font-display text-3xl font-bold tracking-tight text-brand">
                    {Math.round(animatedScore)}
                    <span className="ml-1 text-sm font-semibold text-text-faint">/100</span>
                  </p>
                ) : (
                  <p className="mt-1 font-display text-2xl font-bold text-text-faint">Not enough data</p>
                )}
              </div>
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <Leaf className="size-5" aria-hidden />
              </span>
            </div>
            {bundle.missing.length > 0 && (
              <p className="mt-2 text-xs text-text-faint">
                Missing input for: {bundle.missing.join(', ')}
              </p>
            )}
          </Card>
          <MetricCard
            label="Projected annual savings"
            value={formatCurrency(Math.round(animatedSavings), currency)}
            sub="Solar + efficiency + water"
            icon={PiggyBank}
            tone="brand"
          />
          <MetricCard
            label="CO₂ avoided per year"
            value={`${formatNumber(Math.round(animatedCo2), 0)} kg`}
            sub="Solar generation + waste diversion"
            icon={CloudRain}
            tone="aqua"
          />
          <MetricCard
            label="Full-plan investment"
            value={formatCurrency(totalInvestment, currency)}
            sub={`${recommendations.length} recommendations`}
            icon={Coins}
            tone="solar"
          />
        </div>

        {/* Charts row */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2" data-reveal>
          <Card>
            <CardHeader
              icon={Leaf}
              tone="brand"
              title="Score by module"
              description="Deterministic 0–100 rating per analysis module."
            />
            <CardContent>
              {scoreData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={scoreData}
                      dataKey="value"
                      nameKey="label"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {scoreData.map((entry) => (
                        <Cell key={entry.key} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip contentStyle={palette.tooltip} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-10 text-center text-sm text-text-muted">No module data yet.</p>
              )}
              <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-text-muted">
                {scoreData.map((entry) => (
                  <span key={entry.key} className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden />
                    {entry.label} · {entry.value}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              icon={TrendingUp}
              tone="skye"
              title="Annual savings by source"
              description="Electricity and water bill reductions per year."
            />
            <CardContent>
              {savingsData.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={savingsData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={palette.grid} vertical={false} />
                    <XAxis dataKey="source" tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                    <ChartTooltip
                      contentStyle={palette.tooltip}
                      formatter={(value) => formatCurrency(Number(value), currency)}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {savingsData.map((entry, index) => (
                        <Cell key={entry.source} fill={palette.series[index % palette.series.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-10 text-center text-sm text-text-muted">
                  Add usage details to unlock savings estimates.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Module opportunities */}
        <h2 className="mt-10 font-display text-lg font-bold text-text-strong" data-reveal>
          Module opportunities
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
          <ModuleOpportunity
            to="/solar"
            icon={Sun}
            tone="solar"
            title="Solar"
            badge={bundle.solar ? undefined : 'Missing data'}
            headline={bundle.solar ? `${bundle.solar.assessment.systemSizeKwp} kWp` : '—'}
            sub={bundle.solar ? `${formatCurrency(bundle.solar.assessment.annualSavings, currency)}/yr · ${bundle.solar.assessment.paybackYears ?? '—'} yr payback` : 'Add roof area & electricity use'}
          />
          <ModuleOpportunity
            to="/water"
            icon={Droplets}
            tone="aqua"
            title="Water"
            badge={bundle.water ? undefined : 'Missing data'}
            headline={bundle.water ? `${formatNumber(bundle.water.assessment.annualHarvestLiters, 0)} L/yr` : '—'}
            sub={bundle.water ? `${Math.round(bundle.water.assessment.demandCoverageRatio * 100)}% of demand · ${formatCurrency(bundle.water.assessment.annualSavings, currency)}/yr` : 'Add roof area & water use'}
          />
          <ModuleOpportunity
            to="/efficiency"
            icon={Fan}
            tone="skye"
            title="Efficiency"
            badge={bundle.efficiency ? undefined : 'Missing data'}
            headline={bundle.efficiency ? `Grade ${bundle.efficiency.assessment.grade}` : '—'}
            sub={bundle.efficiency ? `${formatNumber(bundle.efficiency.assessment.annualEnergySavingsKwh, 0)} kWh/yr savable` : 'Add home size & electricity use'}
          />
          <ModuleOpportunity
            to="/waste"
            icon={Recycle}
            tone="lime"
            title="Waste"
            badge={bundle.waste ? undefined : 'Missing data'}
            headline={bundle.waste ? `${formatNumber(bundle.waste.assessment.annualWasteKg, 0)} kg/yr` : '—'}
            sub={bundle.waste ? `${Math.round(bundle.waste.assessment.diversionPotential * 100)}% divertible` : 'Add household size'}
          />
        </div>

        {/* Priority recommendations + warnings */}
        <div className="mt-10 grid gap-6 lg:grid-cols-3" data-reveal>
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-text-strong">Priority recommendations</h2>
              <Link to="/planner" className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
                Full roadmap
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="grid gap-4">
              {priorityRecs.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader icon={Info} tone="neutral" title="Assumptions & notes" description="Every figure is auditable." />
              <CardContent>
                <ul className="space-y-2.5">
                  {(bundle.solar?.assumptions ?? []).slice(0, 2).map((item) => (
                    <AssumptionItem key={item}>{item}</AssumptionItem>
                  ))}
                  {(bundle.water?.assumptions ?? []).slice(0, 2).map((item) => (
                    <AssumptionItem key={item}>{item}</AssumptionItem>
                  ))}
                  {(bundle.efficiency?.assumptions ?? []).slice(0, 1).map((item) => (
                    <AssumptionItem key={item}>{item}</AssumptionItem>
                  ))}
                  {bundle.warnings.map((warning) => (
                    <li key={warning} className="flex items-start gap-2 text-xs leading-relaxed text-text-muted">
                      <Info className="mt-0.5 size-3.5 shrink-0 text-solar" aria-hidden />
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-brand-softer">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-contrast">
                    <Sprout className="size-4.5" aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-text-strong">Your five-year outlook</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-body">
                      Five years of the projected plan ≈{' '}
                      <span className="font-semibold text-brand">
                        {formatCurrency(Math.round(animatedSavings * 5), currency)}
                      </span>{' '}
                      saved and{' '}
                      <span className="font-semibold text-brand">
                        {formatNumber(Math.round(animatedCo2 * 5), 0)} kg
                      </span>{' '}
                      CO₂ avoided.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </article>
    </PageShell>
  )
}

function ModuleOpportunity({
  to,
  icon,
  tone,
  title,
  headline,
  sub,
  badge,
}: {
  to: string
  icon: LucideIcon
  tone: AccentTone
  title: string
  headline: string
  sub: string
  badge?: string
}) {
  return (
    <DashboardCard to={to} title={title} icon={icon} tone={tone} badge={badge}>
      <p className="mt-3 font-display text-xl font-bold text-text-strong">{headline}</p>
      <p className="mt-0.5 text-xs text-text-muted">{sub}</p>
    </DashboardCard>
  )
}

function AssumptionItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-xs leading-relaxed text-text-muted">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
      {children}
    </li>
  )
}

function priorityWeight(priority: 'high' | 'medium' | 'low'): number {
  return priority === 'high' ? 0 : priority === 'medium' ? 1 : 2
}
