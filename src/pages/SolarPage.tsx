import {
  ArrowRight,
  Banknote,
  Coins,
  Gauge,
  Info,
  Leaf,
  Sun,
  Zap,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
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

/** /solar — deterministic rooftop PV assessment. */
export default function SolarPage() {
  const assessment = useAssessment()
  const palette = useChartPalette()
  const reveal = useGsapReveal<HTMLElement>({ selector: '[data-reveal]', y: 18, stagger: 0.06 })

  if (!assessment) {
    return <ModuleUnavailable message="Complete home setup to unlock your solar assessment." />
  }

  const { profile, bundle, recommendations } = assessment
  const result = bundle.solar
  const currency = profile.energy.currency ?? 'USD'

  if (!result) {
    return (
      <ModuleUnavailable
        message="Solar needs roof area and monthly electricity use (or a bill amount)."
        showEdit
      />
    )
  }

  const a = result.assessment
  const annualConsumption = (profile.energy.monthlyElectricityKwh ?? 0) * 12
  const animatedSavings = useCountUp(a.annualSavings)
  const animatedCo2 = useCountUp(a.annualCo2AvoidedKg)

  const comparisonData = [
    { name: 'Your usage', value: Math.round(annualConsumption) },
    { name: 'Solar output', value: Math.round(a.annualGenerationKwh) },
  ]
  const coverageData = [
    { name: 'Covered', value: Math.round(a.coverageRatio * 100), fill: palette.solar },
    { name: 'Remaining', value: 100 - Math.round(a.coverageRatio * 100), fill: palette.grid },
  ]

  const solarRecs = recommendations.filter((rec) => rec.category === 'solar')
  const ai = useAiInsight(
    () =>
      moduleInsight(
        {
          module: 'solar',
          homeSummary: buildHomeSummary(profile),
          calculationFacts: buildCalculationFacts(bundle),
        },
        { surface: 'solar-page' },
      ),
    [profile.updatedAt],
  )

  return (
    <PageShell>
      <article ref={reveal}>
        <PageHeader
          eyebrow="Module 1 · Solar Energy"
          eyebrowIcon={Sun}
          tone="solar"
          title="Rooftop solar potential"
          description="Deterministic sizing from your roof, climate and consumption. Every figure below is auditable — see the assumptions panel."
          actions={<Badge tone="solar">Roof suitability {a.roofSuitabilityScore}/100</Badge>}
        />

        {/* KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
          <MetricCard
            label="Recommended system"
            value={`${a.systemSizeKwp} kWp`}
            sub={`${formatNumber(a.annualGenerationKwh, 0)} kWh/yr generation`}
            icon={Sun}
            tone="solar"
          />
          <MetricCard
            label="Installation cost"
            value={formatCurrency(a.installationCost, currency)}
            sub="Turnkey, before incentives"
            icon={Banknote}
            tone="neutral"
          />
          <MetricCard
            label="Annual savings"
            value={formatCurrency(Math.round(animatedSavings), currency)}
            sub={a.paybackYears !== null ? `${a.paybackYears} yr payback` : 'No savings — check inputs'}
            icon={Coins}
            tone="brand"
          />
          <MetricCard
            label="CO₂ avoided"
            value={`${formatNumber(Math.round(animatedCo2), 0)} kg/yr`}
            sub={`${Math.round(a.coverageRatio * 100)}% of your electricity`}
            icon={Leaf}
            tone="aqua"
          />
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2" data-reveal>
          <Card>
            <CardHeader icon={Zap} tone="solar" title="Usage vs solar output" description="Annual kWh, deterministic comparison." />
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={comparisonData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={palette.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} width={56} />
                  <ChartTooltip contentStyle={palette.tooltip} formatter={(value) => `${formatNumber(Number(value), 0)} kWh`} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    <Cell fill={palette.efficiency} />
                    <Cell fill={palette.solar} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={Gauge} tone="brand" title="Consumption coverage" description="Share of annual demand the array can supply." />
            <CardContent>
              <ResponsiveContainer width="100%" height={210}>
                <RadialBarChart data={coverageData} innerRadius="68%" outerRadius="100%" startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="value" cornerRadius={10} background={{ fill: palette.grid }} />
                  <ChartTooltip contentStyle={palette.tooltip} />
                </RadialBarChart>
              </ResponsiveContainer>
              <p className="-mt-14 text-center font-display text-3xl font-bold text-text-strong">
                {Math.round(a.coverageRatio * 100)}%
              </p>
              <div className="mt-10 flex justify-center gap-4 text-xs text-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: palette.solar }} aria-hidden />
                  {formatNumber(a.annualGenerationKwh, 0)} kWh generated
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: palette.grid }} aria-hidden />
                  {formatNumber(Math.max(0, annualConsumption - a.annualGenerationKwh), 0)} kWh from grid
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI interpretation */}
        <AiInsightCard
          className="mt-6"
          context="Solar"
          insight={ai.loading ? null : ai.unavailable ? undefined : ai.data}
          fallback={fallbackModuleInsight('solar', bundle)}
        />

        {/* Assumptions & warnings */}
        <div className="mt-6 grid gap-6 lg:grid-cols-3" data-reveal>
          <Card className="lg:col-span-2">
            <CardHeader icon={Info} tone="neutral" title="Assumptions" description="Constants live in src/data/constants.ts." />
            <CardContent>
              <ul className="space-y-2.5">
                {result.assumptions.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-muted">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-solar" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              {result.warnings.length > 0 && (
                <div className="mt-4 rounded-xl bg-solar-soft p-3.5">
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
              <p className="text-sm font-semibold text-text-strong">25-year outlook</p>
              <p className="mt-2 text-3xl font-display font-bold text-brand">
                {formatCurrency(Math.round(a.annualSavings * 25), currency)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-text-body">
                Cumulative bill savings over a 25-year panel life (degradation-adjusted output),
                avoiding {formatNumber(a.annualCo2AvoidedKg * 25, 0)} kg CO₂.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {solarRecs.length > 0 && (
          <div className="mt-10" data-reveal>
            <h2 className="mb-4 font-display text-lg font-bold text-text-strong">Solar recommendation</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {solarRecs.map((rec) => (
                <RecommendationCard key={rec.id} recommendation={rec} />
              ))}
            </div>
          </div>
        )}
      </article>
    </PageShell>
  )
}

function ModuleUnavailable({ message, showEdit = false }: { message: string; showEdit?: boolean }) {
  return (
    <PageShell>
      <PageHeader
        eyebrow="Module 1 · Solar Energy"
        eyebrowIcon={Sun}
        tone="solar"
        title="Rooftop solar potential"
      />
      <EmptyState
        icon={Sun}
        title="Not enough data yet"
        description={message}
        action={
          showEdit ? (
            <Button to="/onboarding" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
              Complete home setup
            </Button>
          ) : (
            <Button to="/onboarding" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
              Explore GreenPlan
            </Button>
          )
        }
      />
    </PageShell>
  )
}
