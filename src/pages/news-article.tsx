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

  return (
    <ArticleLayout
      title={entry.title}
      kicker={kicker}
      meta={{ title: `${entry.title} | CodeBG News`, description: entry.description }}
    >
      {entry.body ?? <p>{entry.description}</p>}
    </ArticleLayout>
  )
}
