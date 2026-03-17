import { Section } from '../ui/section'
import { Card } from '../ui/card'
import { CtaLink } from '../ui/cta-link'
import { newsEntries } from '../../data/news'

export function News() {
  return (
    <Section
      id="news"
      heading="News"
      description="Latest updates from our stack, tools, and workflows."
      headerRight={<CtaLink href="/news/">View all news</CtaLink>}
    >
      <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {newsEntries.map((entry) => (
          <Card as="article" key={entry.slug}>
            <p className="text-xs uppercase tracking-wide text-accent-text dark:text-orange-400">
              {entry.date ? `${entry.date} \u00B7 ` : ''}
              {entry.category}
            </p>
            <h3 className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{entry.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{entry.description}</p>
            <CtaLink href={entry.href} className="mt-3 inline-block">
              {entry.linkLabel ?? 'Read article'}
            </CtaLink>
          </Card>
        ))}
      </div>
    </Section>
  )
}
