import type { NewsEntry } from '../types'

export const newsEntries: NewsEntry[] = [
  {
    slug: 'nemoclaw-by-nvidia',
    title: "NemoClaw (OpenClaw plugin): what's confirmed",
    description: 'Verified summary of NVIDIA NemoClaw in OpenClaw deployment context.',
    category: 'NVIDIA',
    date: 'Mar 2026',
    href: '/news/nemoclaw-by-nvidia.html',
    linkLabel: 'Read article',
  },
  {
    slug: 'dynamic-sample-catalog',
    title: 'Sample catalog now updates dynamically',
    description: 'Main site sample cards now load from a shared JSON catalog for faster updates.',
    category: 'Platform',
    href: '/customers/index.html',
    linkLabel: 'Open samples',
  },
  {
    slug: 'local-service-pages',
    title: 'New local service pages are live',
    description: 'Added focused pages for Penticton web design and small business redesign.',
    category: 'SEO',
    href: '/services/web-design-penticton.html',
    linkLabel: 'Read page',
  },
]
