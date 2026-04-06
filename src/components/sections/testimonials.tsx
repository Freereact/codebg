import { ExternalLink } from 'lucide-react'
import { Section } from '../ui/section'
import { Card } from '../ui/card'

const showcaseSites = [
  {
    name: 'Sunrise Bakery',
    type: 'Bakery',
    slug: 'bakery-service',
    description: 'Menu, hours, location, and online presence for a neighborhood bakery.',
  },
  {
    name: 'Penticton Dentist Group',
    type: 'Dental clinic',
    slug: 'dental-cabinet',
    description: 'Services, trust signals, testimonials, and appointment info for a dental practice.',
  },
  {
    name: 'Joyful Mechanics',
    type: 'Auto repair shop',
    slug: 'autoshop',
    description: 'Service list, pricing, reviews, and directions for a local auto shop.',
  },
]

export function Showcase() {
  return (
    <Section id="testimonials" heading="Built with CodeBG">
      <p className="mb-6 mt-2 text-sm text-slate-600 dark:text-slate-400">
        Real sites built on the platform. Each one was created in seconds from a template and business info.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 stagger-children">
        {showcaseSites.map((site) => (
          <Card key={site.slug} as="a" href={`https://sample-apps.codebg.com/${site.slug}/`} variant="link">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-slate-800 dark:text-slate-100">{site.name}</p>
                <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-accent">{site.type}</p>
              </div>
              <ExternalLink size={14} className="mt-1 shrink-0 text-slate-400" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{site.description}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
