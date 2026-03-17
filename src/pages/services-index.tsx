import { Layout, Smartphone, Rocket, Code2, Palette, BarChart3 } from 'lucide-react'
import { useDocumentMeta } from '../hooks/use-document-meta'
import { useScrollReveal } from '../hooks/use-scroll-reveal'
import { Breadcrumbs } from '../components/ui/breadcrumbs'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Carousel } from '../components/ui/carousel'
import { services } from '../data/services'

const iconMap: Record<string, React.ReactNode> = {
  Layout: <Layout size={22} />,
  Smartphone: <Smartphone size={22} />,
  Rocket: <Rocket size={22} />,
}

const extras = [
  {
    icon: <Code2 size={20} />,
    title: 'Clean codebase',
    text: 'TypeScript, React, and Tailwind — modern tools that are easy to maintain and extend.',
  },
  {
    icon: <Palette size={20} />,
    title: 'Custom branding',
    text: 'Your colors, your logo, your personality — applied consistently across every section.',
  },
  {
    icon: <BarChart3 size={20} />,
    title: 'SEO foundations',
    text: 'Schema markup, meta tags, fast load times — built for search engines from day one.',
  },
]

const aiAdvantages = [
  {
    title: 'Faster scaffolding',
    desc: 'AI generates component structure in minutes, not hours. You pay for results, not keystrokes.',
  },
  {
    title: 'Smarter copy iterations',
    desc: 'Multiple headline and CTA variants tested quickly — better messaging without extra cost.',
  },
  {
    title: 'Automated QA',
    desc: 'AI-assisted responsive testing catches layout issues before they reach production.',
  },
  {
    title: 'Low-cost development',
    desc: 'We pass AI productivity gains directly to you. Professional quality at an affordable price.',
  },
]

export function ServicesIndexPage() {
  const detailRef = useScrollReveal<HTMLDivElement>()
  const extrasRef = useScrollReveal<HTMLDivElement>()

  useDocumentMeta({
    title: 'Services — Affordable AI-Powered Web Development | CodeBG',
    description:
      'Low-cost single-page websites built with AI and human expertise. Mobile-first design, fast and agile delivery — from $49 CAD.',
  })

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="section-card p-8 md:p-10">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services' },
          ]}
        />

        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-50 md:text-4xl">
          Affordable, professionally built single-page websites
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          Low-cost development powered by AI, guided by human expertise. Fast and agile delivery
          of conversion-focused websites at a price that used to be impossible.
        </p>
      </div>

      <div ref={detailRef} className="space-y-6 reveal-fade-up">
        {services.map((svc) => (
          <div key={svc.slug} className="section-card p-8 md:p-10">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent dark:bg-orange-950/50 dark:text-orange-400">
                {iconMap[svc.icon]}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{svc.title}</h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{svc.summary}</p>
                <ul className="mt-4 space-y-2">
                  {svc.details.map((d, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div ref={extrasRef} className="section-card p-8 md:p-10 reveal-fade-up">
        <h2 className="section-heading">Also included</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-3 stagger-children">
          {extras.map((e) => (
            <Card as="article" key={e.title}>
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent dark:bg-orange-950/50 dark:text-orange-400">
                {e.icon}
              </div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100">{e.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{e.text}</p>
            </Card>
          ))}
        </div>
      </div>

      <div className="section-card p-8 md:p-10">
        <h2 className="section-heading">Why AI makes it cheaper</h2>
        <div className="mt-6">
          <Carousel autoPlay interval={5000} showArrows>
            {aiAdvantages.map((a) => (
              <div key={a.title} className="px-4 py-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{a.title}</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{a.desc}</p>
              </div>
            ))}
          </Carousel>
        </div>
      </div>

      <div className="section-card bg-gradient-to-br from-accent-soft to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 p-8 md:p-10 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Starting from $49 CAD
        </h2>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          AI powered by human expertise. Low cost. Agile delivery.
        </p>
        <div className="mt-6">
          <Button size="lg" className="pulse-glow" asChild>
            <a href="/#contact">Request your build</a>
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
