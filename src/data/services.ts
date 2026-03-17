export interface ServiceItem {
  slug: string
  title: string
  summary: string
  icon: string
  details: string[]
}

export const services: ServiceItem[] = [
  {
    slug: 'single-page',
    title: 'Single-page structure',
    summary: 'A focused 5-section layout tailored to your business goals.',
    icon: 'Layout',
    details: [
      'Every section is conversion-focused: hero, services, social proof, pricing, and contact.',
      'AI helps us iterate on structure and copy faster, passing the savings directly to you.',
      'No bloated multi-page site — one sharp page that does the job.',
    ],
  },
  {
    slug: 'mobile-first',
    title: 'Mobile-first design',
    summary: 'Built to look clean and readable on modern phones and desktops.',
    icon: 'Smartphone',
    details: [
      'Over 60% of visitors browse on mobile. We design for that reality first.',
      'Responsive layouts, touch-friendly targets, and optimized images out of the box.',
      'AI-assisted responsive testing cuts QA time by half.',
    ],
  },
  {
    slug: 'fast-deploy',
    title: 'Fast deployment',
    summary: 'Versioned delivery with CI-ready workflow for future updates.',
    icon: 'Rocket',
    details: [
      'Automated build pipeline: push code, run tests, deploy — no manual steps.',
      'AI-powered code generation means your site ships in days, not weeks.',
      'Version-controlled so every change is tracked and reversible.',
    ],
  },
]

/** Legacy tuple format for backward compat */
export const serviceTuples = services.map(
  (s) => [s.title, s.summary] as const,
)
