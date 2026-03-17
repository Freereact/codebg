import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export interface DocumentMeta {
  title?: string
  description?: string
  ogType?: string
  robots?: string
  jsonLd?: Record<string, unknown>
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

const JSON_LD_ID = 'page-json-ld'

function setJsonLd(data: Record<string, unknown> | undefined) {
  let el = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null
  if (!data) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('script')
    el.id = JSON_LD_ID
    el.type = 'application/ld+json'
    document.head.appendChild(el)
  }
  el.textContent = JSON.stringify(data)
}

export function useDocumentMeta(meta: DocumentMeta) {
  const location = useLocation()

  useEffect(() => {
    const originalTitle = document.title

    const pageTitle = meta.title ?? 'CodeBG — Fast Small Business Websites in Penticton, BC'
    const pageDesc = meta.description ?? ''
    const pathname = location.pathname === '/' ? '/' : location.pathname.replace(/\/+$/, '')
    const pageUrl = `https://codebg.com${pathname}`
    const pageImage = 'https://codebg.com/og-image.webp'

    document.title = pageTitle

    setMetaTag('name', 'description', pageDesc)
    setMetaTag('name', 'robots', meta.robots ?? 'index,follow,max-image-preview:large')
    setMetaTag('property', 'og:title', pageTitle)
    setMetaTag('property', 'og:description', pageDesc)
    setMetaTag('property', 'og:url', pageUrl)
    setMetaTag('property', 'og:image', pageImage)
    setMetaTag('property', 'og:type', meta.ogType ?? 'website')
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

    setJsonLd(meta.jsonLd)

    return () => {
      document.title = originalTitle
      setJsonLd(undefined)
    }
  }, [meta.title, meta.description, meta.ogType, meta.robots, meta.jsonLd, location.pathname])
}
