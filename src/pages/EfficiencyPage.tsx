import { ArrowRight, Banknote, Coins, Fan, Gauge, Info, Leaf } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageShell } from '../components/layout/PageShell'
import { PageHeader } from '../components/ui/PageHeader'
import { MetricCard } from '../components/ui/MetricCard'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { RecommendationCard } from '../components/ui/RecommendationCard'
import { EmptyState } from '../components/feedback/EmptyState'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useAssessment } from '../hooks/useAssessment'
import { useChartPalette } from '../hooks/useChartPalette'
import { useCountUp } from '../hooks/useCountUp'
import { useGsapReveal } from '../hooks/useGsapReveal'
import { formatCurrency, formatNumber } from '../lib/format'
import { AiInsightCard, useAiInsight } from '../components/ai/AiInsightCard'
import {
  moduleInsight,
  fallbackModuleInsight,
  buildHomeSummary,
  buildCalculationFacts,
} from '../ai/insights'

/** /efficiency — deterministic home efficiency & cooling assessment. */
export default function EfficiencyPage() {
  const assessment = useAssessment()
  const palette = useChartPalette()
  const reveal = useGsapReveal<HTMLElement>({ selector: '[data-reveal]', y: 18, stagger: 0.06 })

  if (!assessment) {
    return <Unavailable message="Complete home setup to unlock your efficiency assessment." />
  }

  const { profile, bundle, recommendations } = assessment
  const result = bundle.efficiency
  const currency = profile.energy.currency ?? 'USD'

  if (!result) {
    return <Unavailable message="Efficiency analysis needs home size and monthly electricity use." showEdit />
  }

  const a = result.assessment
  const annualConsumption = (profile.energy.monthlyElectricityKwh ?? 0) * 12
  const animatedSavingsKwh = useCountUp(a.annualEnergySavingsKwh)
  const animatedSavings = useCountUp(a.annualSavings)

  const measureData = result.measures.map((measure) => ({
    name: measure.label,
    value: measure.annualSavingsKwh,
  }))

  const beforeAfter = [
    { name: 'Now', value: Math.round(annualConsumption) },
    { name: 'After measures', value: Math.round(annualConsumption - a.annualEnergySavingsKwh) },
  ]

  const efficiencyRecs = recommendations.filter((rec) => rec.category === 'efficiency')
  const ai = useAiInsight(
    () =>
      moduleInsight(
        {
          module: 'efficiency',
          homeSummary: buildHomeSummary(profile),
          calculationFacts: buildCalculationFacts(bundle),
        },
        { surface: 'efficiency-page' },
      ),
    [profile.updatedAt],
  )

  return (
    <PageShell>
      <article ref={reveal}>
        <PageHeader
          eyebrow="Module 3 · Efficiency & Cooling"
          eyebrowIcon={Fan}
          tone="skye"
          title="Home efficiency opportunities"
          description="Insulation, glazing, thermostats and AC — each measure's savings computed sequentially on your baseline, no double counting."
          actions={<Badge tone="skye">Efficiency grade {a.grade}</Badge>}
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
          <MetricCard
            label="Energy savable"
            value={`${formatNumber(Math.round(animatedSavingsKwh), 0)} kWh/yr`}
            sub={`${Math.round((a.annualEnergySavingsKwh / Math.max(annualConsumption, 1)) * 100)}% of consumption`}
            icon={Gauge}
            tone="skye"
          />
          <MetricCard
            label="Bill savings"
            value={formatCurrency(Math.round(animatedSavings), currency)}
            sub={`${bundle.tariffPerKwh.toFixed(2)}/kWh applied`}
            icon={Coins}
            tone="brand"
          />
          <MetricCard
            label="All-measures cost"
            value={formatCurrency(a.estimatedCost, currency)}
            sub={a.paybackYears !== null ? `${a.paybackYears} yr combined payback` : 'No savings — check inputs'}
            icon={Banknote}
            tone="neutral"
          />
          <MetricCard
            label="CO₂ avoided"
            value={`${formatNumber(Math.round(a.annualEnergySavingsKwh * 0.45), 0)} kg/yr`}
            sub="Grid intensity 0.45 kg/kWh"
            icon={Leaf}
            tone="aqua"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2" data-reveal>
          <Card>
            <CardHeader icon={Fan} tone="skye" title="Savings by measure" description="Annual kWh saved per measure." />
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={measureData} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={palette.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fill: palette.axisText, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <ChartTooltip contentStyle={palette.tooltip} formatter={(value) => `${formatNumber(Number(value), 0)} kWh/yr`} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {measureData.map((entry, index) => (
                      <Cell key={entry.name} fill={palette.series[index % palette.series.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={Gauge} tone="brand" title="Before vs after" description="Annual consumption with all measures applied." />
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={beforeAfter} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={palette.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
                  <ChartTooltip contentStyle={palette.tooltip} formatter={(value) => `${formatNumber(Number(value), 0)} kWh`} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    <Cell fill={palette.grid} />
                    <Cell fill={palette.brand} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Measure table */}
        <Card className="mt-6" data-reveal>
          <CardHeader icon={Coins} tone="skye" title="Measure detail" description="Costs and payback per measure — the planner uses these directly." />
          <CardContent>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full min-w-[540px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border-base text-xs uppercase tracking-wider text-text-faint">
                    <th className="pb-2 pr-4 font-medium">Measure</th>
                    <th className="pb-2 pr-4 font-medium">Savings</th>
                    <th className="pb-2 pr-4 font-medium">Cost</th>
                    <th className="pb-2 font-medium">Payback</th>
                  </tr>
                </thead>
                <tbody>
                  {result.measures.map((measure) => (
                    <tr key={measure.id} className="border-b border-border-base/60 last:border-0">
                      <td className="py-3 pr-4 font-medium text-text-strong">{measure.label}</td>
                      <td className="py-3 pr-4 text-text-body">
                        {formatNumber(measure.annualSavingsKwh, 0)} kWh ·{' '}
                        {formatCurrency(Math.round(measure.annualSavingsKwh * bundle.tariffPerKwh), currency)}
                      </td>
                      <td className="py-3 pr-4 text-text-body">{formatCurrency(measure.cost, currency)}</td>
                      <td className="py-3 text-text-body">
                        {measure.paybackYears !== null ? `${measure.paybackYears} yr` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* AI interpretation */}
        <AiInsightCard
          className="mt-6"
          context="Efficiency"
          insight={ai.loading ? null : ai.unavailable ? undefined : ai.data}
          fallback={fallbackModuleInsight('efficiency', bundle)}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-3" data-reveal>
          <Card className="lg:col-span-2">
            <CardHeader icon={Info} tone="neutral" title="Assumptions" description="Constants live in src/data/constants.ts." />
            <CardContent>
              <ul className="space-y-2.5">
                {result.assumptions.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-muted">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-skye" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              {result.warnings.length > 0 && (
                <div className="mt-4 rounded-xl bg-skye-soft p-3.5">
                  {result.warnings.map((warning) => (
                    <p key={warning} className="flex items-start gap-2 text-xs leading-relaxed text-text-body">
                      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      {warning}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-brand-softer">
            <CardContent className="pt-6">
              <p className="text-sm font-semibold text-text-strong">Grade {a.grade} explained</p>
              <p className="mt-1 text-xs leading-relaxed text-text-body">
                Graded from post-measure energy intensity (kWh/m²/yr): A ≤ 60, B ≤ 90, C ≤ 120,
                D ≤ 160, E ≤ 200, F ≤ 250, otherwise G. Your home rates{' '}
                <span className="font-semibold text-brand">{a.grade}</span> after all measures.
              </p>
            </CardContent>
          </Card>
        </div>

        {efficiencyRecs.length > 0 && (
          <div className="mt-10" data-reveal>
            <h2 className="mb-4 font-display text-lg font-bold text-text-strong">Efficiency recommendations</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {efficiencyRecs.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        )}
      </article>
    </PageShell>
  )
}

function Unavailable({ message, showEdit = false }: { message: string; showEdit?: boolean }) {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Module 3 · Efficiency & Cooling"
        eyebrowIcon={Fan}
        tone="skye"
        title="Home efficiency opportunities"
      />
      <EmptyState
        icon={Fan}
        title="Not enough data yet"
        description={message}
        action={
          <Button to="/onboarding" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
            {showEdit ? 'Complete home setup' : 'Explore GreenPlan'}
          </Button>
        }
      />
    </PageShell>
  )
}
