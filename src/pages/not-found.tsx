import { ArticleLayout } from '../components/layout/article-layout'

export function NotFoundPage() {
  return (
    <ArticleLayout
      title="Page not found"
      meta={{ title: '404 | CodeBG', robots: 'noindex,nofollow' }}
      breadcrumbs={[{ label: 'Home', href: '/' }, { label: '404' }]}
    >
      <p>The page you're looking for doesn't exist or has been moved.</p>
    </ArticleLayout>
  )
}
