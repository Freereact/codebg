import { useParams, Navigate } from 'react-router-dom'
import { ArticleLayout } from '../components/layout/article-layout'
import { newsEntries } from '../data/news'
import { NotFoundPage } from './not-found'

export function NewsArticlePage() {
  const { slug } = useParams<{ slug: string }>()

  if (slug?.endsWith('.html')) {
    return <Navigate to={`/news/${slug.replace('.html', '')}`} replace />
  }

  const entry = newsEntries.find((e) => e.slug === slug)
  if (!entry) return <NotFoundPage />

  const kicker = [entry.date, entry.category].filter(Boolean).join(' · ')
  const pageUrl = `https://codebg.com/news/${entry.slug}`
  const relatedArticles = newsEntries.filter((e) => e.slug !== entry.slug).slice(0, 3)

  return (
    <ArticleLayout
      title={entry.title}
      kicker={kicker}
      meta={{
        title: `${entry.title} | CodeBG News`,
        description: entry.description,
        ogType: 'article',
        jsonLd: {
          '@context': 'https://schema.org',
          '@type': 'NewsArticle',
          headline: entry.title,
          description: entry.description,
          url: pageUrl,
          image: 'https://codebg.com/og-image.webp',
          datePublished: entry.date ?? undefined,
          author: { '@type': 'Organization', name: 'CodeBG', url: 'https://codebg.com' },
          publisher: {
            '@type': 'Organization',
            name: 'CodeBG',
            url: 'https://codebg.com',
            logo: { '@type': 'ImageObject', url: 'https://codebg.com/og-image.webp' },
          },
        },
      }}
      breadcrumbs={[
        { label: 'Home', href: '/' },
        { label: 'News', href: '/news' },
        { label: entry.title },
      ]}
    >
      {entry.body ?? <p>{entry.description}</p>}

      {relatedArticles.length > 0 && (
        <>
          <hr className="my-6 border-slate-200 dark:border-slate-700" />
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">More from CodeBG</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {relatedArticles.map((a) => (
              <li key={a.slug}>
                <a href={a.href} className="text-accent hover:underline">{a.title}</a>
              </li>
            ))}
            <li>
              <a href="/customers" className="text-accent hover:underline">View sample sites</a>
            </li>
          </ul>
        </>
      )}
    </ArticleLayout>
  )
}
