import { useEffect } from 'react'
import { Header } from './header'
import { Footer } from './footer'

interface SubPageLayoutProps {
  title: string
  kicker?: string
  meta?: { title?: string; description?: string }
  children: React.ReactNode
}

export function SubPageLayout({ title, kicker, meta, children }: SubPageLayoutProps) {
  useEffect(() => {
    document.title = meta?.title ?? `${title} | CodeBG`
    const desc = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (desc && meta?.description) desc.content = meta.description
  }, [title, meta])

  return (
    <div className="app-shell">
      <Header />

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-10 md:px-6 md:py-12">
        <div className="section-card p-8 md:p-10">
          {kicker && (
            <p className="text-xs uppercase tracking-wide text-accent-text">{kicker}</p>
          )}
          <h1 className="section-heading mt-1">{title}</h1>
          <div className="mt-4 space-y-4 leading-relaxed text-slate-600">
            {children}
          </div>
          <p className="mt-6">
            <a href="/" className="text-sm font-medium text-accent hover:underline">
              &larr; Back to CodeBG
            </a>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
