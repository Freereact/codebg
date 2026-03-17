import { ArticleLayout } from '../components/layout/article-layout'

export function NotFoundPage() {
  return (
    <ArticleLayout title="Page not found" meta={{ title: '404 | CodeBG' }}>
      <p>The page you're looking for doesn't exist or has been moved.</p>
    </ArticleLayout>
  )
}
