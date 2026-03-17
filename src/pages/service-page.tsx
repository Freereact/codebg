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

  return (
    <ArticleLayout
      title={entry.title}
      kicker="Services"
      meta={{ title: `${entry.title} | CodeBG`, description: entry.description }}
    >
      {entry.body ?? <p>{entry.description}</p>}
    </ArticleLayout>
  )
}
