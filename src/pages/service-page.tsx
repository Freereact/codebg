import { useParams, Navigate } from 'react-router-dom'
import { ArticleLayout } from '../components/layout/article-layout'
import { servicePages } from '../data/service-pages'
import { NotFoundPage } from './not-found'

export function ServicePage() {
  const { slug } = useParams<{ slug: string }>()

  if (slug?.endsWith('.html')) {
    return <Navigate to={`/services/${slug.replace('.html', '')}`} replace />
  }

  const entry = servicePages.find((e) => e.slug === slug)
  if (!entry) return <NotFoundPage />

  const pageUrl = `https://codebg.com/services/${entry.slug}`
  const relatedServices = servicePages.filter((s) => s.slug !== entry.slug)

  return (
    <ArticleLayout
      title={entry.title}
      kicker="Services"
      meta={{
        title: `${entry.title} | CodeBG`,
        description: entry.description,
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: entry.title,
          description: entry.description,
          url: pageUrl,
          provider: {
            '@type': 'ProfessionalService',
            name: 'CodeBG',
            url: 'https://codebg.com',
            areaServed: { '@type': 'City', name: 'Penticton' },
          },
        },
      }}
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: 'Services' }, { label: entry.title }]}
    >
      {entry.body ?? <p>{entry.description}</p>}

      <hr className="my-6 border-slate-200 dark:border-slate-700" />
      <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Related</h2>
      <ul className="mt-2 space-y-1 text-sm">
        {relatedServices.map((s) => (
          <li key={s.slug}>
            <a href={`/services/${s.slug}`} className="text-accent hover:underline">
              {s.title}
            </a>
          </li>
        ))}
        <li>
          <a href="/customers" className="text-accent hover:underline">
            View sample sites
          </a>
        </li>
        <li>
          <a href="/news" className="text-accent hover:underline">
            Latest news
          </a>
        </li>
      </ul>
    </ArticleLayout>
  )
}
