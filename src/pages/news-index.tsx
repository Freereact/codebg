import { Section } from '../components/ui/section'
import { Card } from '../components/ui/card'
import { CtaLink } from '../components/ui/cta-link'
import { newsEntries } from '../data/news'
import { useDocumentMeta } from '../hooks/use-document-meta'

export function NewsIndexPage() {
  useDocumentMeta({
    title: 'News | CodeBG',
    description: 'Latest updates from our stack, tools, and workflows.',
  })

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <Section id="news" heading="News" description="Latest updates from our stack, tools, and workflows.">
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

      <nav aria-label="Related pages" className="flex flex-wrap gap-4 text-sm">
        <a href="/customers" className="text-accent hover:underline">
          Browse sample sites &rarr;
        </a>
        <a href="/services/web-design-penticton" className="text-accent hover:underline">
          Web design in Penticton &rarr;
        </a>
        <a href="/services/website-redesign" className="text-accent hover:underline">
          Website redesign guide &rarr;
        </a>
      </nav>
    </div>
  )
}
