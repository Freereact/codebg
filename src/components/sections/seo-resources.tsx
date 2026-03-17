import { Section } from '../ui/section'
import { Card } from '../ui/card'

export function SeoResources() {
  return (
    <Section
      id="seo"
      heading="Local web design resources"
      description="Helpful pages for search and planning your project."
    >
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Card as="a" href="/services/web-design-penticton" variant="link" className="rounded-xl">
          <p className="font-medium text-slate-800 dark:text-slate-100">Web Design Penticton, BC</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">What local businesses need from a modern website.</p>
        </Card>
        <Card as="a" href="/services/website-redesign" variant="link" className="rounded-xl">
          <p className="font-medium text-slate-800 dark:text-slate-100">Website Redesign Guide</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">How to improve clarity, UX, and conversion flow.</p>
        </Card>
      </div>
    </Section>
  )
}
