import type { ReactNode } from 'react'
import { useDocumentMeta } from '../../hooks/use-document-meta'
import { Breadcrumbs } from '../ui/breadcrumbs'
import type { DocumentMeta } from '../../hooks/use-document-meta'

export interface BreadcrumbItem {
  label: string
  href?: string
}

interface ArticleLayoutProps {
  title: string
  kicker?: string
  meta?: DocumentMeta
  breadcrumbs?: BreadcrumbItem[]
  children: ReactNode
}

export function ArticleLayout({ title, kicker, meta, breadcrumbs, children }: ArticleLayoutProps) {
  useDocumentMeta({
    title: meta?.title ?? `${title} | CodeBG`,
    description: meta?.description,
    ogType: meta?.ogType,
    robots: meta?.robots,
    jsonLd: meta?.jsonLd,
  })

  return (
    <div className="mx-auto max-w-3xl">
      <div className="section-card p-8 md:p-10">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
        {kicker && <p className="text-xs uppercase tracking-wide text-accent-text dark:text-orange-400">{kicker}</p>}
        <h1 className="section-heading mt-1">{title}</h1>
        <div className="mt-4 space-y-4 leading-relaxed text-slate-600 dark:text-slate-300">{children}</div>
        <p className="mt-6">
          <a href="/" className="text-sm font-medium text-accent hover:underline">
            &larr; Back to CodeBG
          </a>
        </p>
      </div>
    </div>
  )
}
