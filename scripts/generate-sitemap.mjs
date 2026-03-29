#!/usr/bin/env node

/**
 * Build-time sitemap generator.
 * Reads route data + auto-discovers sample apps, then outputs public/sitemap.xml.
 * Run: node scripts/generate-sitemap.mjs
 */

import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SITE = 'https://codebg.com'
const SAMPLE_SITE = 'https://sample-apps.codebg.com'
const today = new Date().toISOString().split('T')[0]

// Auto-discover sample apps from meta.json files
const customersDir = resolve(__dirname, '..', 'sample-apps', 'src', 'customers')
const sampleUrls = readdirSync(customersDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => {
    try {
      const meta = JSON.parse(readFileSync(resolve(customersDir, d.name, 'meta.json'), 'utf-8'))
      return { loc: `${SAMPLE_SITE}/${meta.slug}/`, priority: '0.5', changefreq: 'monthly', absolute: true }
    } catch { return null }
  })
  .filter(Boolean)
  .sort((a, b) => a.loc.localeCompare(b.loc))

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/about', priority: '0.8', changefreq: 'monthly' },
  { loc: '/services', priority: '0.8', changefreq: 'monthly' },
  { loc: '/process', priority: '0.8', changefreq: 'monthly' },
  { loc: '/pricing', priority: '0.8', changefreq: 'monthly' },
  { loc: '/services/web-design-penticton', priority: '0.8', changefreq: 'monthly' },
  { loc: '/services/website-redesign', priority: '0.8', changefreq: 'monthly' },
  { loc: '/customers', priority: '0.7', changefreq: 'weekly' },
  ...sampleUrls,
  { loc: '/news', priority: '0.7', changefreq: 'weekly' },
  { loc: '/news/nemoclaw-by-nvidia', priority: '0.6', changefreq: 'monthly' },
  { loc: '/news/dynamic-sample-catalog', priority: '0.6', changefreq: 'monthly' },
  { loc: '/news/local-service-pages', priority: '0.6', changefreq: 'monthly' },
]

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.absolute ? u.loc : `${SITE}${u.loc}`}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml')
writeFileSync(outPath, xml, 'utf-8')
console.log(`Sitemap written to ${outPath} (${urls.length} URLs, lastmod: ${today})`)
