import { ArrowRight, BadgeCheck, Leaf } from 'lucide-react'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { useGsapReveal } from '../hooks/useGsapReveal'

/**
 * Hero: product positioning + primary CTA + layered CSS/SVG home visual.
 * The visual is pure CSS/SVG (transform-style depth, no 3D framework) and
 * adapts to every theme through tokens.
 */
export function Hero() {
  const ref = useGsapReveal<HTMLElement>({ selector: '[data-reveal]', y: 24, stagger: 0.1 })

  return (
    <section ref={ref} className="relative overflow-hidden bg-grid bg-glow">
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-32 sm:px-6 lg:px-8 sm:pt-36">
        <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="max-w-2xl">
            <div data-reveal>
              <Badge tone="brand">
                <Leaf className="size-3.5" aria-hidden />
                Your home, quantified
              </Badge>
            </div>
            <h1
              data-reveal
              className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-text-strong sm:text-5xl lg:text-6xl"
            >
              Make your home smarter.{' '}
              <span className="text-gradient-brand">Make it more sustainable.</span>
            </h1>
            <p data-reveal className="mt-6 max-w-xl text-lg leading-relaxed text-text-body">
              See what sustainable choices could look like for your home — solar, water,
              efficiency and waste, with transparent math you can audit and AI that explains
              what matters for you without inventing numbers.
            </p>
            <div data-reveal className="mt-8 flex flex-wrap items-center gap-4">
              <Button to="/onboarding" size="lg" rightIcon={<ArrowRight className="size-4" aria-hidden />}>
                Explore GreenPlan
              </Button>
              <Button to="/account" size="lg" variant="secondary">
                Save my plan
              </Button>
              <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                <BadgeCheck className="size-4 text-brand" aria-hidden />
                No account needed to explore
              </span>
            </div>
          </div>

          <div data-reveal className="hidden lg:block">
            <HeroHomeVisual />
          </div>
        </div>
      </div>
    </section>
  )
}

/** Layered SVG/CSS "sustainable home" — themed via CSS variables only. */
function HeroHomeVisual() {
  return (
    <div className="relative mx-auto w-full max-w-md [perspective:1200px]">
      {/* Glowing backdrop card */}
      <div
        className="absolute inset-0 translate-y-6 scale-95 rounded-[2rem] opacity-60 blur-xl"
        style={{ background: 'linear-gradient(135deg, var(--brand-soft), transparent 65%)' }}
        aria-hidden
      />
      <div className="relative [transform:rotateY(-8deg)_rotateX(4deg)] rounded-[2rem] border border-border-base bg-surface-card p-6 shadow-card-hover transition-transform duration-500 hover:[transform:rotateY(0deg)_rotateX(0deg)]">
        <svg viewBox="0 0 320 220" className="w-full" role="img" aria-label="Illustration of a sustainable home">
          {/* Sun */}
          <circle cx="272" cy="42" r="18" fill="var(--solar)" opacity="0.9" />
          <circle cx="272" cy="42" r="26" fill="var(--solar)" opacity="0.2" />
          {/* Rain cloud */}
          <g opacity="0.85">
            <ellipse cx="48" cy="40" rx="24" ry="12" fill="var(--aqua)" opacity="0.5" />
            <ellipse cx="66" cy="34" rx="18" ry="10" fill="var(--aqua)" opacity="0.35" />
            <path d="M44 56 l-3 10 M56 58 l-3 10 M68 56 l-3 10" stroke="var(--aqua)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          {/* House */}
          <g>
            <rect x="70" y="110" width="150" height="80" rx="8" fill="var(--surface-muted)" stroke="var(--border-strong)" />
            <polygon points="60,112 145,62 230,112" fill="var(--brand)" opacity="0.92" />
            {/* Roof panels */}
            <g>
              <rect x="92" y="86" width="34" height="16" rx="2" fill="var(--surface-card)" stroke="var(--border-strong)" transform="skewX(-18)" />
              <rect x="134" y="86" width="34" height="16" rx="2" fill="var(--surface-card)" stroke="var(--border-strong)" transform="skewX(-18)" />
            </g>
            <rect x="128" y="140" width="34" height="50" rx="4" fill="var(--brand)" opacity="0.75" />
            <rect x="84" y="128" width="30" height="26" rx="3" fill="var(--skye)" opacity="0.5" />
            <rect x="178" y="128" width="30" height="26" rx="3" fill="var(--skye)" opacity="0.5" />
          </g>
          {/* Ground */}
          <rect x="30" y="190" width="260" height="6" rx="3" fill="var(--border-strong)" opacity="0.6" />
          {/* Battery / savings chip */}
          <g>
            <rect x="238" y="150" width="60" height="34" rx="10" fill="var(--brand-soft)" />
            <text x="268" y="171" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--brand-text)">
              −CO₂
            </text>
          </g>
        </svg>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          {[
            { label: 'Solar', value: 'kWp' },
            { label: 'Water', value: 'L/yr' },
            { label: 'CO₂', value: 'kg/yr' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-surface-muted px-2 py-2">
              <p className="text-xs font-semibold text-text-strong">{item.label}</p>
              <p className="text-[10px] text-text-faint">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
