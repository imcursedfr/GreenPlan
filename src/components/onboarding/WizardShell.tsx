import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import gsap from 'gsap'
import { cx } from '../../lib/cx'
import { Button } from '../ui/Button'

export interface WizardStepDef {
  id: string
  title: string
  description: string
}

interface WizardShellProps {
  steps: WizardStepDef[]
  currentStep: number
  onNext: () => void
  onBack: () => void
  onFinish: () => void
  /** Next is disabled (invalid input). */
  nextDisabled?: boolean
  /** Message shown when next is disabled. */
  nextHint?: string
  children: ReactNode
}

/**
 * Multi-step wizard chrome: clickable progress dots with labels, GSAP
 * slide/fade between steps, back/next navigation. Reduced motion falls back
 * to instant swaps.
 */
export function WizardShell({
  steps,
  currentStep,
  onNext,
  onBack,
  onFinish,
  nextDisabled = false,
  nextHint,
  children,
}: WizardShellProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const [leaving, setLeaving] = useState<null | 'next' | 'back'>(null)
  const isLast = currentStep === steps.length - 1

  // Slide the incoming panel in after step change.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel || leaving) return
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduced) return
    gsap.fromTo(
      panel,
      { autoAlpha: 0, x: 24 },
      { autoAlpha: 1, x: 0, duration: 0.35, ease: 'power2.out' },
    )
  }, [currentStep, leaving])

  const transition = (direction: 'next' | 'back', action: () => void) => {
    const panel = panelRef.current
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    // Background tabs pause requestAnimationFrame, so GSAP's onComplete would
    // never fire and the wizard would appear stuck. Apply instantly instead.
    if (!panel || reduced || document.hidden) {
      action()
      return
    }
    setLeaving(direction)
    gsap.to(panel, {
      autoAlpha: 0,
      x: direction === 'next' ? -24 : 24,
      duration: 0.22,
      ease: 'power2.in',
      onComplete: () => {
        action()
        setLeaving(null)
      },
    })
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      {/* Progress */}
      <ol className="mb-8 flex items-center gap-1.5" aria-label="Wizard progress">
        {steps.map((step, index) => {
          const done = index < currentStep
          const active = index === currentStep
          return (
            <li key={step.id} className="flex min-w-0 flex-1 flex-col gap-1.5">
              <div
                className={cx(
                  'h-1.5 rounded-full transition-colors duration-300',
                  done ? 'bg-brand' : active ? 'bg-brand/50' : 'bg-surface-muted',
                )}
                aria-hidden
              />
              <span
                className={cx(
                  'hidden truncate text-xs font-medium sm:block',
                  active ? 'text-brand' : done ? 'text-text-body' : 'text-text-faint',
                )}
              >
                {done && <Check className="mr-0.5 inline size-3" aria-hidden />}
                {step.title}
              </span>
            </li>
          )
        })}
      </ol>

      {/* Step panel */}
      <div
        ref={panelRef}
        className="rounded-3xl border border-border-base bg-surface-card p-6 shadow-card sm:p-8"
        aria-live="polite"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-brand">
          Step {currentStep + 1} of {steps.length}
        </p>
        <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-text-strong">
          {steps[currentStep].title}
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-text-muted">{steps[currentStep].description}</p>

        <div className="mt-7">{children}</div>

        {/* Controls */}
        <div className="mt-8 flex items-center justify-between gap-4 border-t border-border-base pt-5">
          <Button variant="ghost" onClick={() => transition('back', onBack)} disabled={currentStep === 0} leftIcon={<ArrowLeft className="size-4" aria-hidden />}>
            Back
          </Button>
          <div className="flex flex-col items-end gap-1">
            {nextDisabled && nextHint && <p className="text-xs text-text-faint">{nextHint}</p>}
            {isLast ? (
              <Button onClick={() => transition('next', onFinish)} disabled={nextDisabled} rightIcon={<Check className="size-4" aria-hidden />}>
                Create my plan
              </Button>
            ) : (
              <Button onClick={() => transition('next', onNext)} disabled={nextDisabled} rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                Next
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
