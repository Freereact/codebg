import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

interface DocumentMeta {
  title?: string
  description?: string
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

export function useDocumentMeta(meta: DocumentMeta) {
  const location = useLocation()

  useEffect(() => {
    const originalTitle = document.title

    const pageTitle = meta.title ?? 'CodeBG — Fast Small Business Websites in Penticton, BC'
    const pageDesc = meta.description ?? ''
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

    return () => {
      document.title = originalTitle
    }
  }, [meta.title, meta.description, location.pathname])
}
