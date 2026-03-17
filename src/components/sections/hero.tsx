import { Button } from '../ui/button'
import heroBg from '../../assets/hero-bg.webp'

interface HeroProps {
  onContactClick: () => void
}

export function Hero({ onContactClick }: HeroProps) {
  return (
    <section
      id="about"
      className="section-card relative overflow-hidden p-8 md:p-14"
      style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-surface/94 via-surface/92 to-surface/96 dark:from-[#22262d]/95 dark:via-[#22262d]/93 dark:to-[#22262d]/97 backdrop-blur-[3px]" />
      <div className="relative max-w-3xl rounded-2xl border border-white/80 dark:border-slate-600/60 bg-surface/90 dark:bg-slate-800/90 p-6 shadow-lg backdrop-blur-sm md:p-10">
        <p className="mb-3 inline-flex rounded-full border border-accent-soft-border bg-accent-soft/95 dark:bg-orange-950/60 dark:border-orange-800/50 px-3 py-1 text-xs font-medium text-accent-text dark:text-orange-400">
          Canadian web development
        </p>
        <h1 className="text-4xl font-bold leading-tight text-slate-900 dark:text-slate-50 md:text-5xl lg:text-[3.25rem]">
          Professional one-page websites, built in a weekend.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300 md:text-xl">
          We deliver fast, clean, low-maintenance websites for Canadian businesses. Built with modern tooling,
          practical UX, and clear communication from start to launch.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button size="lg" onClick={onContactClick}>Get your site started</Button>
          <Button size="lg" variant="ghost" asChild>
            <a href="#samples">View samples</a>
          </Button>
        </div>
      </div>
    </section>
  )
}
