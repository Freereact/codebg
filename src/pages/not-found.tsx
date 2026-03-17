import { SubPageLayout } from '../components/layout/sub-page-layout'

export function NotFoundPage() {
  return (
    <SubPageLayout title="Page not found" meta={{ title: '404 | CodeBG' }}>
      <p>The page you're looking for doesn't exist or has been moved.</p>
    </SubPageLayout>
  )
}
