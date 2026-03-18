import { Zap, Shield, TrendingDown, Bot } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useDocumentMeta } from '../hooks/use-document-meta'
import { useScrollReveal } from '../hooks/use-scroll-reveal'
import { Breadcrumbs } from '../components/ui/breadcrumbs'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { AnimatedCounter } from '../components/ui/animated-counter'
import type { ContactOutletContext } from '../components/layout/root-layout'

const stats = [
  { end: 49, prefix: '$', suffix: '', label: 'Starting price (CAD)' },
  { end: 60, prefix: '', suffix: '%', label: 'Cost reduction with AI' },
  { end: 3, prefix: '', suffix: ' days', label: 'Average delivery time' },
  { end: 10, prefix: '', suffix: '+', label: 'Years of experience' },
]

const values = [
  {
    icon: <TrendingDown size={20} />,
    title: 'Low-cost development',
    text: 'AI eliminates repetitive work, cutting build time and your invoice — affordable websites without compromise.',
  },
  {
    icon: <Zap size={20} />,
    title: 'Fast, agile delivery',
    text: 'Automated pipelines and AI code generation mean your site ships in days, not weeks. Agile and iterative.',
  },
  {
    icon: <Shield size={20} />,
    title: 'Human expertise at every step',
    text: 'AI powered by human craft — every line of code is reviewed by a developer with 10+ years of experience.',
  },
  {
    icon: <Bot size={20} />,
    title: 'Affordable by design',
    text: 'We pass AI productivity gains directly to you — professional quality at a fraction of the traditional cost.',
  },
]

export function AboutPage() {
  const { openContactModal } = useOutletContext<ContactOutletContext>()
  const revealRef = useScrollReveal<HTMLDivElement>()
  const statsRef = useScrollReveal<HTMLDivElement>()

  useDocumentMeta({
    title: 'About — Low-Cost AI Web Development Backed by Human Expertise | CodeBG',
    description:
      'AI powered by human expertise. CodeBG delivers affordable small business websites with fast, agile delivery — 10+ years of experience, from $49 CAD.',
  })

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="section-card p-8 md:p-10">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />

        <p className="mt-4 inline-flex rounded-full border border-accent-soft-border bg-accent-soft/95 dark:bg-orange-950/60 dark:border-orange-800/50 px-3 py-1 text-xs font-medium text-accent-text dark:text-orange-400">
          Local. Human. AI-efficient.
        </p>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-50 md:text-4xl">
          A local developer you can talk to — using AI to keep your costs low.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          CodeBG is a one-person, community-focused web studio. 10+ years of hands-on development experience, powered by
          AI tools to cut build time and cost — so you get a professional website with real human attention at a
          fraction of the traditional price.
        </p>

        <div ref={statsRef} className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-4 reveal-fade-up">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-accent md:text-4xl">
                <AnimatedCounter end={stat.end} prefix={stat.prefix} suffix={stat.suffix} />
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div ref={revealRef} className="section-card p-8 md:p-10 reveal-fade-up">
        <h2 className="section-heading">How AI keeps development costs low</h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          Traditional web development bills you for every hour of manual work. We use AI to automate the repetitive
          parts — scaffolding, responsive testing, copy iterations — so our experts focus only on what matters:
          strategy, design decisions, and code quality.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 stagger-children">
          {values.map((v) => (
            <Card as="article" key={v.title}>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent dark:bg-orange-950/50 dark:text-orange-400">
                {v.icon}
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">{v.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{v.text}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="section-card bg-gradient-to-br from-accent-soft to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 p-8 md:p-10 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Ready to get your site built?</h2>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          AI powered by human expertise. Low cost. Fast delivery.
        </p>
        <div className="mt-6">
          <Button size="lg" className="pulse-glow" onClick={openContactModal}>
            Get started
          </Button>
        </div>
      </div>

      <p>
        <a href="/" className="text-sm font-medium text-accent hover:underline">
          &larr; Back to CodeBG
        </a>
      </p>
    </div>
  )
}
