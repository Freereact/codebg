#!/usr/bin/env node

/**
 * Build-time sitemap generator.
 * Reads route data and outputs public/sitemap.xml with lastmod dates.
 * Run: node scripts/generate-sitemap.mjs
 */

const SITE = 'https://codebg.com'
const today = new Date().toISOString().split('T')[0]

const urls = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/services/web-design-penticton', priority: '0.8', changefreq: 'monthly' },
  { loc: '/services/website-redesign', priority: '0.8', changefreq: 'monthly' },
  { loc: '/customers', priority: '0.7', changefreq: 'weekly' },
  { loc: '/customers/autoshop/', priority: '0.5', changefreq: 'monthly' },
  { loc: '/customers/dental-cabinet/', priority: '0.5', changefreq: 'monthly' },
  { loc: '/customers/winery/', priority: '0.5', changefreq: 'monthly' },
  { loc: '/customers/massage-service/', priority: '0.5', changefreq: 'monthly' },
  { loc: '/customers/bakery-service/', priority: '0.5', changefreq: 'monthly' },
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
    <loc>${SITE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = resolve(__dirname, '..', 'public', 'sitemap.xml')
writeFileSync(outPath, xml, 'utf-8')
console.log(`Sitemap written to ${outPath} (${urls.length} URLs, lastmod: ${today})`)
