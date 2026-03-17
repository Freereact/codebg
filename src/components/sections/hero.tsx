import { useScrollReveal } from '../../hooks/use-scroll-reveal'
import { Button } from '../ui/button'
import { CtaLink } from '../ui/cta-link'
import heroBg from '../../assets/hero-bg.webp'

interface HeroProps {
  onContactClick: () => void
}

export function Hero({ onContactClick }: HeroProps) {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section
      id="about"
      ref={ref}
      className="section-card relative overflow-hidden p-8 md:p-14"
      style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-surface/94 via-surface/92 to-surface/96 dark:from-[#22262d]/95 dark:via-[#22262d]/93 dark:to-[#22262d]/97 backdrop-blur-[3px]" />
      <div className="reveal-scale-in relative max-w-3xl rounded-2xl border border-white/80 dark:border-slate-600/60 bg-surface/90 dark:bg-slate-800/90 p-6 shadow-lg backdrop-blur-sm md:p-10">
        <p className="mb-3 inline-flex rounded-full border border-accent-soft-border bg-accent-soft/95 dark:bg-orange-950/60 dark:border-orange-800/50 px-3 py-1 text-xs font-medium text-accent-text dark:text-orange-400">
          AI powered by human expertise
        </p>
        <h1 className="text-4xl font-bold leading-tight text-slate-900 dark:text-slate-50 md:text-5xl lg:text-[3.25rem]">
          Low-cost websites, built fast with AI and human craft.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300 md:text-xl">
          Affordable web development powered by AI, perfected by experienced developers. Fast and agile
          delivery — your professional website live in days, not weeks.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" className="pulse-glow" onClick={onContactClick}>Get your site started</Button>
          <Button size="lg" variant="ghost" asChild>
            <a href="#samples">View samples</a>
          </Button>
        </div>
        <div className="mt-4">
          <CtaLink href="/about">See how AI keeps costs low</CtaLink>
        </div>
      </div>
    </section>
  )
}
