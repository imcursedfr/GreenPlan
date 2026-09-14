import { useEffect, useState, type ReactNode } from 'react'
import { Bot, CheckCircle2, CircleAlert, Compass, ListChecks, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader } from '../ui/Card'
import { Badge } from '../ui/Badge'
import { Skeleton } from '../feedback/LoadingState'

interface InsightSections {
  whyItMatters?: string[]
  priorities?: string[]
  nextSteps?: string[]
  considerations?: string[]
}

interface AiInsightCardProps {
  title?: string
  /** null = loading, undefined = AI unavailable (fallback shown). */
  insight: { summary: string } & InsightSections | null | undefined
  /** Deterministic copy shown when AI is unavailable or failed. */
  fallback: { summary: string } & InsightSections
  /** Context shown next to the AI badge, e.g. "Solar". */
  context?: string
  className?: string
}

/**
 * "GreenPlan AI Insight" panel.
 *
 * Distinct premium treatment — calm editorial layout, not a chatbot. Shows a
 * skeleton while the AI call is in flight, real AI content when available,
 * and deterministic fallback copy with a subtle notice when it isn't.
 */
export function AiInsightCard({ title = 'GreenPlan AI Insight', insight, fallback, context, className }: AiInsightCardProps) {
  const isUnavailable = insight === undefined
  const content = insight ?? fallback

  return (
    <Card className={className}>
      <CardHeader
        icon={Bot}
        tone="brand"
        title={title}
        description={
          isUnavailable
            ? 'AI personalization is unavailable right now. Showing your calculated GreenPlan.'
            : 'Personalized from your deterministic results — numbers always come from the calculation engines.'
        }
        action={
          <Badge tone={isUnavailable ? 'neutral' : 'brand'}>
            {isUnavailable ? 'Fallback' : 'AI'}
          </Badge>
        }
      />
      <CardContent>
        {insight === null ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <p className="pt-1 text-xs text-text-faint">GreenPlan AI is interpreting your results…</p>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-text-body">{content.summary}</p>

            {content.whyItMatters && content.whyItMatters.length > 0 && (
              <InsightSection icon={Sparkles} label="Why this matters">
                {content.whyItMatters.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-text-muted">
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    {item}
                  </li>
                ))}
              </InsightSection>
            )}

            {content.priorities && content.priorities.length > 0 && (
              <InsightSection icon={Compass} label="What I'd prioritize">
                <ol className="space-y-1.5">
                  {content.priorities.map((item, index) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-text-body">
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-[10px] font-bold text-brand-text">
                        {index + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ol>
              </InsightSection>
            )}

            {content.nextSteps && content.nextSteps.length > 0 && (
              <InsightSection icon={ListChecks} label="Your next step">
                <ul className="space-y-1.5">
                  {content.nextSteps.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm leading-relaxed text-text-body">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-brand" aria-hidden />
                      {item}
                    </li>
                  ))}
                </ul>
              </InsightSection>
            )}

            {content.considerations && content.considerations.length > 0 && (
              <div className="rounded-xl bg-surface-muted p-3.5">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-text-strong">
                  <CircleAlert className="size-3.5" aria-hidden />
                  {context ? `${context} considerations` : 'Considerations'}
                </p>
                <ul className="mt-1.5 space-y-1">
                  {content.considerations.map((item) => (
                    <li key={item} className="text-xs leading-relaxed text-text-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function InsightSection({ icon: Icon, label, children }: { icon: React.ComponentType<{ className?: string }>; label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-text-muted">
        <Icon className="size-3.5 text-brand" aria-hidden />
        {label}
      </p>
      <ul className="space-y-1.5">{children}</ul>
    </div>
  )
}

/**
 * Hook: run an AI insight task against the funnel with loading/unavailable
 * states, cancelling on unmount or input change. Import lazily by callers.
 */
export function useAiInsight<T>(
  runner: () => Promise<{ data: T | null; requestId: string; durationMs: number }>,
  deps: readonly unknown[],
): { data: T | null; loading: boolean; unavailable: boolean } {
  const [state, setState] = useState<{ data: T | null; loading: boolean; unavailable: boolean }>({
    data: null,
    loading: true,
    unavailable: false,
  })

  useEffect(() => {
    let cancelled = false
    setState((previous) => ({ ...previous, loading: true }))
    runner()
      .then((result) => {
        if (!cancelled) {
          setState({
            data: result.data,
            loading: false,
            unavailable: result.data === null,
          })
        }
      })
      .catch(() => {
        if (!cancelled) setState({ data: null, loading: false, unavailable: true })
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
