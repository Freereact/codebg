import { Link } from 'react-router-dom'
import { useScrollReveal } from '../../hooks/use-scroll-reveal'
import { Button } from '../ui/button'
import { CtaLink } from '../ui/cta-link'
import heroBg from '../../assets/hero-bg.webp'

export function Hero() {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section
      id="about"
      ref={ref}
      className="section-card relative overflow-hidden p-8 md:p-14"
      style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-surface/94 via-surface/92 to-surface/96 dark:from-[#22262d]/95 dark:via-[#22262d]/93 dark:to-[#22262d]/97 backdrop-blur-[3px]" />
      <div className="reveal-scale-in relative max-w-3xl rounded-2xl border border-white/80 bg-surface/90 p-6 shadow-lg backdrop-blur-sm dark:border-slate-600/60 dark:bg-slate-800/90 md:p-10">
        <p className="mb-3 inline-flex rounded-full border border-accent-soft-border bg-accent-soft/95 px-3 py-1 text-xs font-medium text-accent-text dark:border-orange-800/50 dark:bg-orange-950/60 dark:text-orange-400">
          Free to start — no credit card required
        </p>
        <h1 className="text-4xl font-bold leading-tight text-slate-900 dark:text-slate-50 md:text-5xl lg:text-[3.25rem]">
          Build your business website. Own every line of code.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300 md:text-xl">
          Pick a template, add your business info, and get a real React site — live in seconds. Download it. Deploy
          anywhere. No lock-in, ever.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Button size="lg" className="pulse-glow" asChild>
            <Link to="/login">Create your site — free</Link>
          </Button>
          <Button size="lg" variant="ghost" asChild>
            <a href="#samples">View templates</a>
          </Button>
        </div>
        <div className="mt-4">
          <CtaLink href="/pricing">See pricing — from $19/mo</CtaLink>
        </div>
      </div>
    </section>
  )
}
