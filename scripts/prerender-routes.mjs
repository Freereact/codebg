#!/usr/bin/env node

/**
 * Post-build script: generates static HTML shells for each route
 * so crawlers see correct meta tags without waiting for JS.
 * Copies dist/index.html and patches <title>, meta description,
 * canonical, OG tags, and robots for each route.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = resolve(__dirname, '..', 'dist')
const template = readFileSync(resolve(distDir, 'index.html'), 'utf-8')

const SITE = 'https://codebg.com'

const routes = [
  {
    path: '/news',
    title: 'News | CodeBG',
    description: 'Latest updates from our stack, tools, and workflows.',
  },
  {
    path: '/news/nemoclaw-by-nvidia',
    title: "NemoClaw (OpenClaw plugin): what's confirmed | CodeBG News",
    description: 'Verified summary of NVIDIA NemoClaw in OpenClaw deployment context.',
    ogType: 'article',
  },
  {
    path: '/news/dynamic-sample-catalog',
    title: 'Sample catalog now updates dynamically | CodeBG News',
    description: 'Main site sample cards now load from a shared JSON catalog for faster updates.',
    ogType: 'article',
  },
  {
    path: '/news/local-service-pages',
    title: 'New local service pages are live | CodeBG News',
    description: 'Added focused pages for Penticton web design and small business redesign.',
    ogType: 'article',
  },
  {
    path: '/about',
    title: 'About CodeBG — AI-Powered Web Development That Reduces Your Cost',
    description: 'CodeBG combines 10+ years of web development expertise with AI to deliver professional websites faster and at a fraction of the traditional cost.',
  },
  {
    path: '/services',
    title: 'Services — AI-Powered Web Development | CodeBG',
    description: 'Single-page websites built with AI: mobile-first design, fast deployment, and pricing that reflects real efficiency gains.',
  },
  {
    path: '/process',
    title: 'Our Process — From Brief to Launch in Days | CodeBG',
    description: 'A transparent 4-step process: brief, draft, build, launch. AI accelerates every phase so you get a professional site faster and cheaper.',
  },
  {
    path: '/pricing',
    title: 'Pricing — Professional Websites from $49 CAD | CodeBG',
    description: 'AI-powered web development starting at $49 CAD. Get a professional single-page website delivered in days, not weeks.',
  },
  {
    path: '/customers',
    title: 'Samples | CodeBG',
    description: 'Explore live examples and pick the structure that best matches your business.',
  },
  {
    path: '/services/web-design-penticton',
    title: 'Web Design in Penticton, BC | CodeBG',
    description: 'CodeBG builds fast, conversion-focused websites for local businesses with clear structure and pricing.',
  },
  {
    path: '/services/website-redesign',
    title: 'Small Business Website Redesign | CodeBG',
    description: 'We redesign outdated pages into modern section-based layouts with better UX and conversions.',
  },
]

function patchHtml(html, route) {
  const url = `${SITE}${route.path}`
  const ogType = route.ogType ?? 'website'

  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${route.title}</title>`)
    .replace(/(<meta name="description" content=")[^"]*"/, `$1${route.description}"`)
    .replace(/(<meta name="robots" content=")[^"]*"/, `$1index,follow,max-image-preview:large"`)
    .replace(/(<link rel="canonical" href=")[^"]*"/, `$1${url}"`)
    .replace(/(<meta property="og:title" content=")[^"]*"/, `$1${route.title}"`)
    .replace(/(<meta property="og:description" content=")[^"]*"/, `$1${route.description}"`)
    .replace(/(<meta property="og:url" content=")[^"]*"/, `$1${url}"`)
    .replace(/(<meta property="og:type" content=")[^"]*"/, `$1${ogType}"`)
    .replace(/(<meta name="twitter:title" content=")[^"]*"/, `$1${route.title}"`)
    .replace(/(<meta name="twitter:description" content=")[^"]*"/, `$1${route.description}"`)
}

let count = 0
for (const route of routes) {
  const dir = resolve(distDir, route.path.replace(/^\//, ''))
  mkdirSync(dir, { recursive: true })
  const outFile = resolve(dir, 'index.html')
  writeFileSync(outFile, patchHtml(template, route), 'utf-8')
  count++
}

console.log(`Pre-rendered ${count} route shells in dist/`)
