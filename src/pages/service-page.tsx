import { useParams, Navigate } from 'react-router-dom'
import { SubPageLayout } from '../components/layout/sub-page-layout'
import { servicePages } from '../data/service-pages'
import { NotFoundPage } from './not-found'

export function ServicePage() {
  const { slug } = useParams<{ slug: string }>()

  // Handle legacy .html URLs
  if (slug?.endsWith('.html')) {
    return <Navigate to={`/services/${slug.replace('.html', '')}`} replace />
  }

  const entry = servicePages.find((e) => e.slug === slug)
  if (!entry) return <NotFoundPage />

  return (
    <SubPageLayout
      title={entry.title}
      kicker="Services"
      meta={{ title: `${entry.title} | CodeBG`, description: entry.description }}
    >
      {entry.body ?? <p>{entry.description}</p>}
    </SubPageLayout>
  )
}
