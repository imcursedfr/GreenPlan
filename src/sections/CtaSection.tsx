import { ArrowRight } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { SectionContainer } from '../components/ui/SectionContainer'

/** Final call-to-action of the landing page. */
export function CtaSection() {
  return (
    <SectionContainer className="pb-24">
      <Card
        className="overflow-hidden border-brand-soft p-10 text-center sm:p-14"
        // Themed gradient: brand-soft → card → aqua-soft
      >
        <div
          className="absolute inset-0 -z-10"
          style={{ background: 'linear-gradient(135deg, var(--brand-softer) 0%, var(--surface-card) 45%, var(--aqua-soft) 100%)' }}
          aria-hidden
        />
        <h2 className="font-display text-3xl font-bold tracking-tight text-text-strong">
          Ready to see your home's potential?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-base leading-relaxed text-text-body">
          Set up your home profile and get a prioritized sustainability roadmap with real
          payback math.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Button to="/onboarding" size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
            Explore GreenPlan
          </Button>
          <Button to="/account" size="lg" variant="secondary">
            Save My Plan
          </Button>
        </div>
        <p className="mt-4 text-sm text-text-muted">
          Explore freely — create an account only when you're ready to save.
        </p>
      </Card>
    </SectionContainer>
  )
}
