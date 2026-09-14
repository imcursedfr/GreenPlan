import type { LucideIcon } from 'lucide-react'
import { cx } from '../lib/cx'
import { PageShell } from '../components/layout/PageShell'
import { PageHeader } from '../components/ui/PageHeader'
import { Card, CardContent, CardHeader } from '../components/ui/Card'
import { EmptyState } from '../components/feedback/EmptyState'
import { Badge } from '../components/ui/Badge'
import type { AccentTone } from '../lib/accents'

export interface ModulePageContent {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  tone: AccentTone
  /** What the deterministic engine will compute in this module. */
  plannedOutputs: string[]
  /** Inputs the onboarding flow will collect for this module. */
  plannedInputs: string[]
}

/** Tailwind classes must be static — map tones to bullet dot colors. */
const dotClass: Record<AccentTone, string> = {
  brand: 'bg-brand-500',
  aqua: 'bg-cyan-500',
  solar: 'bg-amber-500',
  skye: 'bg-sky-500',
  lime: 'bg-lime-500',
  neutral: 'bg-ink-400',
}

/**
 * Shared template for the four module pages. Keeps placeholder pages
 * consistent and demonstrates the component system end to end.
 */
export function ModulePage({ content }: { content: ModulePageContent }) {
  const Icon = content.icon

  return (
    <PageShell>
      <PageHeader
        eyebrow={content.eyebrow}
        eyebrowIcon={Icon}
        tone={content.tone}
        title={content.title}
        description={content.description}
        actions={<Badge tone={content.tone}>Foundation build</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader icon={Icon} tone={content.tone} title="Planned outputs" description="Computed by deterministic code in src/calculations." />
          <CardContent>
            <ul className="space-y-2.5">
              {content.plannedOutputs.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-600">
                  <span className={cx('mt-1.5 size-1.5 shrink-0 rounded-full', dotClass[content.tone])} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader icon={Icon} tone={content.tone} title="Required inputs" description="Collected during onboarding." />
          <CardContent>
            <ul className="space-y-2.5">
              {content.plannedInputs.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-ink-600">
                  <span className={cx('mt-1.5 size-1.5 shrink-0 rounded-full', dotClass[content.tone])} aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <EmptyState
        className="mt-8"
        icon={Icon}
        tone={content.tone}
        title="Assessment engine not connected yet"
        description="This module's calculations arrive in the next foundation step. Numbers will always come from auditable code, never from the AI."
      />
    </PageShell>
  )
}
