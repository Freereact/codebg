import { useDocumentMeta } from '../hooks/use-document-meta'
import { useScrollReveal } from '../hooks/use-scroll-reveal'
import { Breadcrumbs } from '../components/ui/breadcrumbs'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { processSteps } from '../data/process-steps'

export function ProcessPage() {
  const stepsRef = useScrollReveal<HTMLDivElement>()
  const whyRef = useScrollReveal<HTMLDivElement>()

  useDocumentMeta({
    title: 'Process — Fast, Agile Website Delivery in Days | CodeBG',
    description:
      'A fast, agile 4-step process: brief, draft, build, launch. AI powered by human expertise delivers low-cost professional websites in days.',
  })

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <div className="section-card p-8 md:p-10">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Process' },
          ]}
        />

        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-50 md:text-4xl">
          Fast and agile — from brief to launch in days
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          Agile, transparent, and affordable. AI powered by human expertise moves every phase faster —
          and we pass that speed directly to your timeline and cost.
        </p>
      </div>

      <div ref={stepsRef} className="reveal-fade-up">
        {processSteps.map((step, i) => (
          <div
            key={step.number}
            className="relative flex gap-6 pb-10 last:pb-0"
          >
            {/* Timeline connector */}
            {i < processSteps.length - 1 && (
              <div className="absolute left-5 top-12 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
            )}

            <div className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-white shadow-md">
              {step.number}
            </div>

            <div className="section-card flex-1 p-6 md:p-8">
              <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{step.title}</h2>
              <p className="mt-2 text-slate-600 dark:text-slate-400">{step.summary}</p>
              <ul className="mt-4 space-y-2">
                {step.details.map((d, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div ref={whyRef} className="section-card p-8 md:p-10 reveal-fade-up">
        <h2 className="section-heading">Why this process costs you less</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 stagger-children">
          <Card as="article">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">AI does the repetitive work</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Scaffolding, responsive variants, copy drafts — AI handles the bulk, and our expert
              polishes the result. You only pay for the thinking, not the typing.
            </p>
          </Card>
          <Card as="article">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Fewer revision rounds</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Clear intake, wireframe approval, and fast iteration mean we get it right quickly.
              Less back-and-forth = lower cost for everyone.
            </p>
          </Card>
          <Card as="article">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Automated deployment</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Push, test, deploy — our CI pipeline eliminates manual deployment steps and the
              human errors that come with them.
            </p>
          </Card>
          <Card as="article">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">Transparent scope</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              You know exactly what you&apos;re getting before we start building. No surprise invoices,
              no scope creep.
            </p>
          </Card>
        </div>
      </div>

      <div className="section-card bg-gradient-to-br from-accent-soft to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 p-8 md:p-10 text-center">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Let&apos;s start with Step 1
        </h2>
        <p className="mt-2 text-slate-700 dark:text-slate-300">
          Tell us about your business. We&apos;ll have a plan within 24 hours.
        </p>
        <div className="mt-6">
          <Button size="lg" className="pulse-glow" asChild>
            <a href="/#contact">Start your brief</a>
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
