import { Section } from '../ui/section'
import { Card } from '../ui/card'
import { processSteps } from '../../data/process-steps'

export function Process() {
  return (
    <Section id="process" heading="How we build">
      <p className="mt-4 text-slate-600 dark:text-slate-400">
        We build with{' '}
        <a
          href="https://openclaw.ai/"
          target="_blank"
          rel="noreferrer"
          className="underline decoration-dotted text-accent-text hover:text-accent-text-hover"
          title="OpenClaw lets experts orchestrate AI-assisted development safely and quickly."
        >
          OpenClaw
        </a>{' '}
        and AI under expert supervision, backed by 10+ years of web development experience.
      </p>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-4">
        {processSteps.map(([step, desc]) => (
          <Card as="article" key={step}>
            <p className="font-medium text-slate-800 dark:text-slate-100">{step}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{desc}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
