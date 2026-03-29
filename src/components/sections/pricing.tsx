import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Section } from '../ui/section'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { CtaLink } from '../ui/cta-link'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Create and preview your site. No credit card required.',
    features: [
      'Pick from 6 templates',
      'Fill in your business info',
      'Instant preview',
      'Download as ZIP',
      'Visual feedback system',
    ],
    cta: 'Start building',
    ctaLink: '/login',
    featured: false,
  },
  {
    name: 'Starter',
    price: '$19',
    period: '/mo',
    description: 'Your site live at a public URL. Managed hosting included.',
    features: [
      'Everything in Free',
      'Public site at subdomain.codebg.com',
      'Automatic SSL certificate',
      'Email support',
      'GitHub repo for your project',
    ],
    cta: 'Get started',
    ctaLink: '/login',
    featured: true,
  },
  {
    name: 'Professional',
    price: '$39',
    period: '/mo',
    description: 'Custom domain, priority support, and content updates.',
    features: [
      'Everything in Starter',
      'Custom domain setup',
      'Priority support',
      'Monthly content updates',
      'Advanced customization',
    ],
    cta: 'Get started',
    ctaLink: '/login',
    featured: false,
  },
]

export function Pricing() {
  return (
    <Section
      id="pricing"
      heading="Simple, transparent pricing"
      headerRight={<CtaLink href="/pricing">Full details</CtaLink>}
    >
      <p className="mb-8 mt-2 text-sm text-slate-600 dark:text-slate-400">
        Start free. Pay only when you want a public site. Own your code always.
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {tiers.map((tier) => (
          <Card key={tier.name} variant={tier.featured ? 'featured' : 'default'} className="flex flex-col p-6">
            <p className="text-sm font-medium uppercase tracking-wide text-accent">{tier.name}</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-4xl font-bold text-slate-900 dark:text-white">{tier.price}</span>
              {tier.period && <span className="text-sm text-slate-500 dark:text-slate-400">{tier.period}</span>}
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{tier.description}</p>
            <ul className="mt-6 flex-1 space-y-2">
              {tier.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check size={16} className="mt-0.5 shrink-0 text-accent" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button size="lg" className={`w-full ${tier.featured ? 'pulse-glow' : ''}`} asChild>
                <Link to={tier.ctaLink}>{tier.cta}</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  )
}
