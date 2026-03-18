import { Check, DollarSign } from 'lucide-react'
import { useOutletContext } from 'react-router-dom'
import { useDocumentMeta } from '../hooks/use-document-meta'
import { useScrollReveal } from '../hooks/use-scroll-reveal'
import { Breadcrumbs } from '../components/ui/breadcrumbs'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { AnimatedCounter } from '../components/ui/animated-counter'
import { Carousel } from '../components/ui/carousel'
import type { ContactOutletContext } from '../components/layout/root-layout'

const included = [
  'Custom single-page website (5 sections)',
  'Mobile-first responsive design',
  'SEO foundations (meta, schema, sitemap)',
  'Contact form with email delivery',
  'Dark mode support',
  'Performance-optimized build',
  'Version-controlled source code',
  'CI/CD deployment pipeline',
]

const comparisons = [
  { label: 'Traditional agency', price: '$2,000–$5,000', time: '4–8 weeks' },
  { label: 'Freelancer', price: '$800–$2,000', time: '2–4 weeks' },
  { label: 'CodeBG (AI-powered)', price: 'From $49', time: '2–3 days', highlight: true },
]

const faqs = [
  {
    q: 'Why is it so affordable?',
    a: 'AI handles scaffolding, responsive testing, and copy iterations. Our expert reviews everything. You pay for quality results, not billable hours.',
  },
  {
    q: 'What if I need more than 5 sections?',
    a: 'Additional sections are available at a fair rate. Contact us with your requirements for a custom quote.',
  },
  {
    q: 'Do I own the code?',
    a: 'Yes. You get the full source code, version-controlled in your own repository.',
  },
  {
    q: 'Is there ongoing support?',
    a: 'Post-launch support is included. For ongoing maintenance or updates, we offer flexible arrangements.',
  },
]

const costBreakdown = [
  { item: '.ca domain name', cost: '~$15/year', note: 'Your own Canadian web address' },
  { item: 'CodeBG website build', cost: 'From $49', note: 'Professional 5-section site' },
  { item: 'Hosting on Netlify', cost: 'Free', note: 'Fast, reliable static hosting' },
]

export function PricingPage() {
  const { openContactModal } = useOutletContext<ContactOutletContext>()
  const compRef = useScrollReveal<HTMLDivElement>()
  const costRef = useScrollReveal<HTMLDivElement>()
  const faqRef = useScrollReveal<HTMLDivElement>()

  useDocumentMeta({
    title: 'Pricing — Low-Cost Professional Websites from $49 CAD | CodeBG',
    description:
      'Affordable AI-powered web development from $49 CAD. Low-cost, fast and agile delivery — professional websites in days, not weeks.',
  })

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="section-card p-8 md:p-10">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Pricing' }]} />

        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-50 md:text-4xl">
          Low-cost web development, powered by AI efficiency
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          AI powered by human expertise means affordable websites without compromise. No hidden fees, no hourly
          surprises — just fast, agile delivery at a low cost.
        </p>
      </div>

      <Card variant="featured" className="p-8 md:p-10">
        <div className="flex flex-col items-center text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-accent-text dark:text-orange-400">
            Single-page website
          </p>
          <p className="mt-3 text-5xl font-bold text-slate-900 dark:text-slate-50 md:text-6xl">
            <AnimatedCounter end={49} prefix="$" />
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">CAD · Starting price</p>
          <p className="mt-4 max-w-md text-slate-700 dark:text-slate-300">
            AI powered by human expertise delivers a professional 5-section website at low cost — in days, not weeks.
          </p>
          <div className="mt-6">
            <Button size="lg" className="pulse-glow" onClick={openContactModal}>
              Request your build
            </Button>
          </div>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {included.map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
              <Check size={16} className="flex-shrink-0 text-accent" />
              {item}
            </div>
          ))}
        </div>
      </Card>

      <div ref={compRef} className="section-card p-8 md:p-10 reveal-fade-up">
        <h2 className="section-heading">How we compare</h2>
        <div className="mt-6 space-y-3">
          {comparisons.map((c) => (
            <div
              key={c.label}
              className={`flex items-center justify-between rounded-xl border p-4 transition-all ${
                c.highlight
                  ? 'border-accent bg-accent-soft dark:bg-orange-950/30 dark:border-orange-800/50'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <div>
                <p
                  className={`font-medium ${c.highlight ? 'text-accent-text dark:text-orange-400' : 'text-slate-800 dark:text-slate-100'}`}
                >
                  {c.label}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{c.time}</p>
              </div>
              <p className={`text-lg font-bold ${c.highlight ? 'text-accent' : 'text-slate-800 dark:text-slate-100'}`}>
                {c.price}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div ref={costRef} className="section-card p-8 md:p-10 reveal-fade-up">
        <h2 className="section-heading">Total cost to get online</h2>
        <p className="mt-4 text-slate-600 dark:text-slate-400">
          Everything you need to launch your small business online — no surprises, no monthly fees for your website.
        </p>
        <div className="mt-6 space-y-3">
          {costBreakdown.map((c) => (
            <div
              key={c.item}
              className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-700 p-4"
            >
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">{c.item}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{c.note}</p>
              </div>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{c.cost}</p>
            </div>
          ))}
          <div className="flex items-center justify-between rounded-xl border border-accent bg-accent-soft dark:bg-orange-950/30 dark:border-orange-800/50 p-4">
            <div className="flex items-center gap-2">
              <DollarSign size={20} className="text-accent" />
              <p className="font-semibold text-accent-text dark:text-orange-400">Total to launch</p>
            </div>
            <p className="text-xl font-bold text-accent">Under $100 CAD</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Your site is built deployment-ready. Netlify offers free hosting for static sites — just connect your
          repository and you're live.
        </p>
      </div>

      <div ref={faqRef} className="section-card p-8 md:p-10 reveal-fade-up">
        <h2 className="section-heading">Frequently asked</h2>
        <div className="mt-6">
          <Carousel autoPlay={false} showArrows showDots>
            {faqs.map((faq) => (
              <div key={faq.q} className="px-4 py-2">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{faq.q}</h3>
                <p className="mt-2 text-slate-600 dark:text-slate-400">{faq.a}</p>
              </div>
            ))}
          </Carousel>
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
