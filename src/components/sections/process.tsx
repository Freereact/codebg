import { Section } from '../ui/section'
import { Card } from '../ui/card'
import { CtaLink } from '../ui/cta-link'
import { processSteps } from '../../data/process-steps'

export function Process() {
  return (
    <Section id="process" heading="How we build" headerRight={<CtaLink href="/process">Full process</CtaLink>}>
      <p className="mt-4 text-slate-600 dark:text-slate-400">
        From your info to a live site — four steps, no meetings, no waiting.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-4 stagger-children">
        {processSteps.map((step) => (
          <Card as="article" key={step.number}>
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
              {step.number}
            </span>
            <p className="mt-2 font-medium text-slate-800 dark:text-slate-100">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{step.summary}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
