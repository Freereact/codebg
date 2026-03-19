import type { TemplateSlug } from './site-config-schema.js'

interface TemplateMeta {
  readonly slug: TemplateSlug
  readonly title: string
  readonly description: string
  readonly tags: readonly string[]
}

const TEMPLATE_META: Record<TemplateSlug, TemplateMeta> = {
  autoshop: {
    slug: 'autoshop',
    title: 'Auto Shop',
    description: 'Services, trust points, reviews, location, and call-to-action.',
    tags: ['hero', 'services', 'testimonials', 'location'],
  },
  bakery: {
    slug: 'bakery',
    title: 'Bakery',
    description: 'Menu, freshness story, testimonials, and location.',
    tags: ['hero', 'pricing', 'benefits', 'testimonials', 'location'],
  },
  dental: {
    slug: 'dental',
    title: 'Dental Clinic',
    description: 'Services, trust points, patient testimonials, and booking CTA.',
    tags: ['hero', 'services', 'benefits', 'testimonials', 'cta'],
  },
  massage: {
    slug: 'massage',
    title: 'Massage & Wellness',
    description: 'Services, pricing, relaxation gallery, and booking.',
    tags: ['hero', 'services', 'pricing', 'gallery', 'cta'],
  },
  'skaha-cafe': {
    slug: 'skaha-cafe',
    title: 'Cafe',
    description: 'Menu, ambiance gallery, story, and location.',
    tags: ['hero', 'pricing', 'gallery', 'benefits', 'location'],
  },
  winery: {
    slug: 'winery',
    title: 'Winery',
    description: 'Wine list, vineyard gallery, tasting notes, and visits.',
    tags: ['hero', 'pricing', 'gallery', 'testimonials', 'location'],
  },
}

// Default theme CSS per template — CSS variable overrides
const TEMPLATE_THEMES: Record<TemplateSlug, string> = {
  autoshop: `:root {
  --color-primary: #2563eb;
  --color-primary-soft: #dbeafe;
  --color-bg: #f8fafc;
}`,
  bakery: `:root {
  --color-primary: #b45309;
  --color-primary-soft: #fef3c7;
  --color-bg: #faf8f4;
}`,
  dental: `:root {
  --color-primary: #0891b2;
  --color-primary-soft: #cffafe;
  --color-bg: #f0fdfa;
}`,
  massage: `:root {
  --color-primary: #7c3aed;
  --color-primary-soft: #ede9fe;
  --color-bg: #faf5ff;
}`,
  'skaha-cafe': `:root {
  --color-primary: #ca8a04;
  --color-primary-soft: #fef9c3;
  --color-bg: #fefce8;
}`,
  winery: `:root {
  --color-primary: #9f1239;
  --color-primary-soft: #ffe4e6;
  --color-bg: #fff1f2;
}`,
}

export function getTemplateMeta(slug: TemplateSlug): TemplateMeta {
  return TEMPLATE_META[slug]
}

export function getAllTemplates(): readonly TemplateMeta[] {
  return Object.values(TEMPLATE_META)
}

export function getTemplateThemeCss(slug: TemplateSlug): string {
  return TEMPLATE_THEMES[slug]
}
