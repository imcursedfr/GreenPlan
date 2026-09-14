import {
  ArrowRight,
  Banknote,
  CloudRain,
  Coins,
  Droplets,
  Info,
  Waves,
} from 'lucide-react'
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

/** /water — deterministic rainwater harvesting assessment. */
export default function WaterPage() {
  const assessment = useAssessment()
  const palette = useChartPalette()
  const reveal = useGsapReveal<HTMLElement>({ selector: '[data-reveal]', y: 18, stagger: 0.06 })

  if (!assessment) {
    return <Unavailable message="Complete home setup to unlock your water assessment." />
  }

  const { profile, bundle, recommendations } = assessment
  const result = bundle.water
  const currency = profile.water.currency ?? 'USD'

  if (!result) {
    return (
      <Unavailable message="Water analysis needs roof area and monthly water usage." showEdit />
    )
  }

  const a = result.assessment
  const annualDemand = (profile.water.monthlyWaterM3 ?? 0) * 1000 * 12
  const animatedHarvest = useCountUp(a.annualHarvestLiters)
  const animatedSavings = useCountUp(a.annualSavings)

  const sourceData = [
    { name: 'Rainwater harvest', value: Math.round(a.annualHarvestLiters) },
    { name: 'Municipal (remaining)', value: Math.max(0, Math.round(annualDemand - a.annualHarvestLiters)) },
  ]
  const storageData = [
    { name: 'Demand / m³', value: Math.round(annualDemand / 1000), fill: palette.efficiency },
    { name: 'Harvest / m³', value: Math.round(a.annualHarvestLiters / 1000), fill: palette.water },
  ]

  const waterRecs = recommendations.filter((rec) => rec.category === 'water')
  const ai = useAiInsight(
    () =>
      moduleInsight(
        {
          module: 'water',
          homeSummary: buildHomeSummary(profile),
          calculationFacts: buildCalculationFacts(bundle),
        },
        { surface: 'water-page' },
      ),
    [profile.updatedAt],
  )

  return (
    <PageShell>
      <article ref={reveal}>
        <PageHeader
          eyebrow="Module 2 · Water Management"
          eyebrowIcon={Droplets}
          tone="aqua"
          title="Rainwater harvesting potential"
          description="Deterministic harvest, storage sizing and bill savings from your roof area, climate and demand."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
          <MetricCard
            label="Annual harvest potential"
            value={`${formatNumber(Math.round(animatedHarvest), 0)} L`}
            sub="Runoff + filter losses applied"
            icon={CloudRain}
            tone="aqua"
          />
          <MetricCard
            label="Recommended storage"
            value={`${formatNumber(a.recommendedStorageLiters, 0)} L`}
            sub="14-day demand buffer"
            icon={Waves}
            tone="skye"
          />
          <MetricCard
            label="System cost"
            value={formatCurrency(a.estimatedSystemCost, currency)}
            sub={`Tank + pump + diverter`}
            icon={Banknote}
            tone="neutral"
          />
          <MetricCard
            label="Annual bill savings"
            value={formatCurrency(Math.round(animatedSavings), currency)}
            sub={
              a.paybackYears !== null
                ? `${a.paybackYears} yr payback · ${Math.round(a.demandCoverageRatio * 100)}% of demand`
                : `${Math.round(a.demandCoverageRatio * 100)}% of demand`
            }
            icon={Coins}
            tone="brand"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2" data-reveal>
          <Card>
            <CardHeader icon={Droplets} tone="aqua" title="Water sources" description="Annual liters: harvest vs remaining municipal demand." />
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={sourceData} layout="vertical" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={palette.grid} horizontal={false} />
                  <XAxis type="number" tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={140} tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <ChartTooltip contentStyle={palette.tooltip} formatter={(value) => `${formatNumber(Number(value), 0)} L`} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    <Cell fill={palette.water} />
                    <Cell fill={palette.grid} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={Waves} tone="skye" title="Demand vs harvest" description="Annual cubic meters." />
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={storageData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={palette.grid} vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: palette.axisText, fontSize: 12 }} axisLine={false} tickLine={false} width={48} />
                  <ChartTooltip contentStyle={palette.tooltip} formatter={(value) => `${formatNumber(Number(value), 0)} m³`} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    <Cell fill={palette.efficiency} />
                    <Cell fill={palette.water} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* AI interpretation */}
        <AiInsightCard
          className="mt-6"
          context="Water"
          insight={ai.loading ? null : ai.unavailable ? undefined : ai.data}
          fallback={fallbackModuleInsight('water', bundle)}
        />

        <div className="mt-6 grid gap-6 lg:grid-cols-3" data-reveal>
          <Card className="lg:col-span-2">
            <CardHeader icon={Info} tone="neutral" title="Assumptions" description="Constants live in src/data/constants.ts." />
            <CardContent>
              <ul className="space-y-2.5">
                {result.assumptions.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-muted">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-aqua" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              {result.warnings.length > 0 && (
                <div className="mt-4 rounded-xl bg-aqua-soft p-3.5">
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
              <p className="text-sm font-semibold text-text-strong">Municipal water offset</p>
              <p className="mt-2 font-display text-3xl font-bold text-brand">
                {formatNumber(Math.round(a.annualHarvestLiters / 1000), 1)} m³
              </p>
              <p className="mt-1 text-xs leading-relaxed text-text-body">
                of municipal demand offset per year — {formatNumber(a.annualHarvestLiters * 10, 0)} liters
                over a decade, at the documented tariff.
              </p>
            </CardContent>
          </Card>
        </div>

        {waterRecs.length > 0 && (
          <div className="mt-10" data-reveal>
            <h2 className="mb-4 font-display text-lg font-bold text-text-strong">Water recommendation</h2>
            <div className="grid gap-4 lg:grid-cols-2">
              {waterRecs.map((rec) => (
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
        eyebrow="Module 2 · Water Management"
        eyebrowIcon={Droplets}
        tone="aqua"
        title="Rainwater harvesting potential"
      />
      <EmptyState
        icon={Droplets}
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
