import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Header } from './header'
import { Footer } from './footer'

interface SubPageLayoutProps {
  title: string
  kicker?: string
  meta?: { title?: string; description?: string }
  children: React.ReactNode
}

function setMetaTag(attr: string, key: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.content = content
}

export function SubPageLayout({ title, kicker, meta, children }: SubPageLayoutProps) {
  const location = useLocation()

  useEffect(() => {
    const pageTitle = meta?.title ?? `${title} | CodeBG`
    const pageDesc = meta?.description ?? ''
    const pageUrl = `https://codebg.com${location.pathname}`
    const pageImage = 'https://codebg.com/og-image.webp'

    document.title = pageTitle

    setMetaTag('name', 'description', pageDesc)
    setMetaTag('property', 'og:title', pageTitle)
    setMetaTag('property', 'og:description', pageDesc)
    setMetaTag('property', 'og:url', pageUrl)
    setMetaTag('property', 'og:image', pageImage)
    setMetaTag('property', 'og:type', 'website')
    setMetaTag('property', 'og:site_name', 'CodeBG')
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', pageTitle)
    setMetaTag('name', 'twitter:description', pageDesc)
    setMetaTag('name', 'twitter:image', pageImage)

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = pageUrl
  }, [title, meta, location.pathname])

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
