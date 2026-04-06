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
    title: 'Conversion-focused layout',
    summary: 'One sharp page designed to turn visitors into customers.',
    icon: 'Layout',
    details: [
      'Every section earns its place: hero, services, social proof, pricing, and contact.',
      'No bloated multi-page site — one focused page that drives calls, visits, and bookings.',
      'Built from industry-proven templates that work for real small businesses.',
    ],
  },
  {
    slug: 'mobile-first',
    title: 'Perfect on every device',
    summary: 'Your site looks great on phones, tablets, and desktops — automatically.',
    icon: 'Smartphone',
    details: [
      'Over 60% of your customers browse on mobile. Your site is built for that reality.',
      'Responsive layouts, touch-friendly buttons, and optimized images out of the box.',
      'Tested across screen sizes so nothing breaks for your visitors.',
    ],
  },
  {
    slug: 'fast-deploy',
    title: 'Live in seconds, updated instantly',
    summary: 'Your site is built and ready to preview before you finish your coffee.',
    icon: 'Rocket',
    details: [
      'Pick a template, add your info, and your site is live in seconds.',
      'Push a change to GitHub and your site rebuilds automatically.',
      'Every change is version-controlled — nothing is ever lost.',
    ],
  },
]

/** Legacy tuple format for backward compat */
export const serviceTuples = services.map((s) => [s.title, s.summary] as const)
