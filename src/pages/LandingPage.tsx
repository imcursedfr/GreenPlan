import { Hero } from '../sections/Hero'
import { ModulesSection } from '../sections/ModulesSection'
import { HowItWorksSection } from '../sections/HowItWorksSection'
import { CtaSection } from '../sections/CtaSection'

/**
 * Landing page foundation. Layout (navbar/footer) is provided by
 * LandingLayout via the route table, so the page composes only sections.
 */
export default function LandingPage() {
  return (
    <>
      <Hero />
      <ModulesSection />
      <HowItWorksSection />
      <CtaSection />
    </>
  )
}
