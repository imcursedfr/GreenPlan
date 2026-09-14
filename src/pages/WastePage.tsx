import { ArrowRight, Info, Recycle, Sprout, Trash2, Trees } from 'lucide-react'
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
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
import { formatNumber } from '../lib/format'
import { AiInsightCard, useAiInsight } from '../components/ai/AiInsightCard'
import {
  moduleInsight,
  fallbackModuleInsight,
  buildHomeSummary,
  buildCalculationFacts,
} from '../ai/insights'

/** /waste — deterministic waste & resource assessment. */
export default function WastePage() {
  const assessment = useAssessment()
  const palette = useChartPalette()
  const reveal = useGsapReveal<HTMLElement>({ selector: '[data-reveal]', y: 18, stagger: 0.06 })

  if (!assessment) {
    return <Unavailable message="Complete home setup to unlock your waste assessment." />
  }

  const { profile, bundle, recommendations } = assessment
  const result = bundle.waste

  if (!result) {
    return <Unavailable message="Waste analysis needs your household size." showEdit />
  }

  const a = result.assessment
  const animatedWaste = useCountUp(a.annualWasteKg)
  const animatedCo2 = useCountUp(a.annualCo2AvoidedKg)
  const divertedKg = Math.round(a.annualWasteKg * a.diversionPotential)
  const landfillKg = a.annualWasteKg - divertedKg

  const diversionData = [
    { name: 'Diverted', value: divertedKg, fill: palette.waste },
    { name: 'Landfill', value: landfillKg, fill: palette.grid },
  ]

  const wasteRecs = recommendations.filter((rec) => rec.category === 'waste')
  const ai = useAiInsight(
    () =>
      moduleInsight(
        {
          module: 'waste',
          homeSummary: buildHomeSummary(profile),
          calculationFacts: buildCalculationFacts(bundle),
        },
        { surface: 'waste-page' },
      ),
    [profile.updatedAt],
  )

  return (
    <PageShell>
      <article ref={reveal}>
        <PageHeader
          eyebrow="Module 4 · Waste & Resources"
          eyebrowIcon={Recycle}
          tone="lime"
          title="Waste & resource reduction"
          description="Deterministic waste generation and diversion potential from your household profile and adopted measures."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-reveal>
          <MetricCard
            label="Annual household waste"
            value={`${formatNumber(Math.round(animatedWaste), 0)} kg`}
            sub={`${profile.home.householdSize ?? 1} occupants × 440 kg`}
            icon={Trash2}
            tone="neutral"
          />
          <MetricCard
            label="Divertible from landfill"
            value={`${Math.round(a.diversionPotential * 100)}%`}
            sub={`${formatNumber(divertedKg, 0)} kg/yr`}
            icon={Recycle}
            tone="lime"
          />
          <MetricCard
            label="CO₂ avoided now"
            value={`${formatNumber(Math.round(animatedCo2), 0)} kg/yr`}
            sub="From current diversion"
            icon={Trees}
            tone="brand"
          />
          <MetricCard
            label="Opportunities found"
            value={String(result.opportunities.filter((o) => !o.alreadyAdopted).length)}
            sub="Measures you haven't adopted"
            icon={Sprout}
            tone="aqua"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2" data-reveal>
          <Card>
            <CardHeader icon={Recycle} tone="lime" title="Waste destinations" description="Current diversion vs landfill, kg/yr." />
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={diversionData} dataKey="value" nameKey="name" innerRadius={62} outerRadius={95} paddingAngle={3} strokeWidth={0}>
                    {diversionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip contentStyle={palette.tooltip} formatter={(value) => `${formatNumber(Number(value), 0)} kg`} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 flex justify-center gap-5 text-xs text-text-muted">
                {diversionData.map((entry) => (
                  <span key={entry.name} className="inline-flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.fill }} aria-hidden />
                    {entry.name} · {formatNumber(entry.value, 0)} kg
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader icon={Sprout} tone="lime" title="Diversion opportunities" description="Impact of each measure you haven't adopted yet." />
            <CardContent>
              <ul className="space-y-4">
                {result.opportunities.map((opportunity) => (
                  <li key={opportunity.id} className="flex items-center justify-between gap-4 rounded-xl border border-border-base p-3.5">
                    <div>
                      <p className="text-sm font-semibold text-text-strong">{opportunity.label}</p>
                      <p className="mt-0.5 text-xs text-text-muted">
                        {opportunity.alreadyAdopted
                          ? 'Already adopted — included in your current score.'
                          : `Would divert waste and avoid ~${formatNumber(opportunity.annualCo2AvoidedKg, 0)} kg CO₂/yr.`}
                      </p>
                    </div>
                    <span
                      className={
                        opportunity.alreadyAdopted
                          ? 'shrink-0 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand-text'
                          : 'shrink-0 rounded-full bg-lime-soft px-2.5 py-1 text-xs font-semibold text-text-strong'
                      }
                    >
                      {opportunity.alreadyAdopted ? 'Done' : 'Available'}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* AI interpretation */}
        <AiInsightCard
          className="mt-6"
          context="Waste"
          insight={ai.loading ? null : ai.unavailable ? undefined : ai.data}
          fallback={fallbackModuleInsight('waste', bundle)}
        />

        <Card className="mt-6" data-reveal>
          <CardHeader icon={Info} tone="neutral" title="Assumptions" description="Constants live in src/data/constants.ts." />
          <CardContent>
            <ul className="space-y-2.5">
              {result.assumptions.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-muted">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-lime" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            {result.warnings.length > 0 && (
              <div className="mt-4 rounded-xl bg-lime-soft p-3.5">
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

        {wasteRecs.length > 0 && (
          <div className="mt-10" data-reveal>
            <h2 className="mb-4 font-display text-lg font-bold text-text-strong">Waste recommendations</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {wasteRecs.map((rec) => (
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
        eyebrow="Module 4 · Waste & Resources"
        eyebrowIcon={Recycle}
        tone="lime"
        title="Waste & resource reduction"
      />
      <EmptyState
        icon={Recycle}
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
