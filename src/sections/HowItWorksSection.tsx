import { Bot, Calculator, ClipboardList, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SectionContainer } from '../components/ui/SectionContainer'
import { useGsapReveal } from '../hooks/useGsapReveal'

const steps: { icon: LucideIcon; title: string; description: string }[] = [
  {
    icon: ClipboardList,
    title: 'Describe your home',
    description: 'Location, size, household and bills — a two-minute setup.',
  },
  {
    icon: Calculator,
    title: 'Deterministic analysis',
    description: 'Verified formulas compute costs, savings, payback and CO₂.',
  },
  {
    icon: Bot,
    title: 'AI personalization',
    description: 'AI explains results in your context — never invents numbers.',
  },
  {
    icon: ShieldCheck,
    title: 'Validated output',
    description: 'Constraints checked before anything reaches you.',
  },
]

/** Explains the deterministic-first architecture as a product benefit. */
export function HowItWorksSection() {
  const ref = useGsapReveal<HTMLDivElement>({ selector: '[data-reveal]' })

  return (
    <SectionContainer id="how-it-works" className="bg-surface-page">
      <div ref={ref}>
        <div className="mx-auto max-w-2xl text-center">
          <div data-reveal>
            <Badge tone="brand">Transparent by design</Badge>
          </div>
          <h2 data-reveal className="mt-4 font-display text-3xl font-bold tracking-tight text-text-strong">
            Numbers from math. Words from AI.
          </h2>
          <p data-reveal className="mt-3 text-base leading-relaxed text-text-body">
            Most tools let a language model guess your savings. We compute them with auditable
            formulas — the AI only personalizes validated results.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <Card key={step.title} className="h-full p-6">
              <span className="flex size-10 items-center justify-center rounded-xl bg-brand-soft text-brand">
                <step.icon className="size-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold text-text-strong">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{step.description}</p>
            </Card>
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}
