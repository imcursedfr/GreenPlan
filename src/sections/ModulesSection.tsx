import { Link } from 'react-router-dom'
import { ArrowRight, Droplets, Fan, Recycle, Sun, type LucideIcon } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { SectionContainer } from '../components/ui/SectionContainer'
import { chipTones, type AccentTone } from '../lib/accents'
import { cx } from '../lib/cx'
import { useGsapReveal } from '../hooks/useGsapReveal'

interface ModuleInfo {
  title: string
  description: string
  icon: LucideIcon
  tone: AccentTone
  route: string
}

const modules: ModuleInfo[] = [
  {
    title: 'Solar Energy',
    description:
      'Array size, generation, installation cost, payback and CO₂ avoided — computed from your roof and usage.',
    icon: Sun,
    tone: 'solar',
    route: '/solar',
  },
  {
    title: 'Water Management',
    description:
      'Rainwater harvesting potential, recommended storage and bill savings based on roof area and rainfall.',
    icon: Droplets,
    tone: 'aqua',
    route: '/water',
  },
  {
    title: 'Efficiency & Cooling',
    description:
      'Insulation, shading, glazing and AC efficiency opportunities ranked by savings, not guesswork.',
    icon: Fan,
    tone: 'skye',
    route: '/efficiency',
  },
  {
    title: 'Waste & Resources',
    description:
      'Segregation, composting and recycling potential with annual CO₂ avoided from diversion.',
    icon: Recycle,
    tone: 'lime',
    route: '/waste',
  },
]

/** The four sustainability analysis lenses of the product. */
export function ModulesSection() {
  const ref = useGsapReveal<HTMLDivElement>({ selector: '[data-reveal]' })

  return (
    <SectionContainer id="modules">
      <div ref={ref}>
        <div className="mx-auto max-w-2xl text-center">
          <div data-reveal>
            <Badge tone="neutral">Four analysis modules</Badge>
          </div>
          <h2 data-reveal className="mt-4 font-display text-3xl font-bold tracking-tight text-text-strong">
            One home. Four sustainability lenses.
          </h2>
          <p data-reveal className="mt-3 text-base leading-relaxed text-text-body">
            Every module runs verified formulas on your inputs — then AI explains what the
            numbers mean for your family.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <Link key={module.route} to={module.route} data-reveal className="group block">
              <Card hover className="h-full p-6">
                <span className={cx('flex size-11 items-center justify-center rounded-xl', chipTones[module.tone])}>
                  <module.icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold text-text-strong">{module.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{module.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand">
                  Learn more
                  <ArrowRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </SectionContainer>
  )
}
