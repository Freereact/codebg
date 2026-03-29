import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useDocumentMeta } from '../hooks/use-document-meta'
import { useScrollReveal } from '../hooks/use-scroll-reveal'
import { Breadcrumbs } from '../components/ui/breadcrumbs'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: '',
    description: 'Create and preview your site. No credit card needed.',
    features: [
      'Pick from 6 industry templates',
      'Fill in your business info',
      'Site built in seconds',
      'Private preview in your dashboard',
      'Click-to-comment visual feedback',
      'Download as standalone ZIP',
      'Git repo with full source code',
    ],
    cta: 'Start building — free',
    featured: false,
  },
  {
    name: 'Starter',
    price: '$19',
    period: '/mo',
    description: 'Your site live on a public URL with managed hosting.',
    features: [
      'Everything in Free',
      'Public site at subdomain.codebg.com',
      'Automatic SSL certificate',
      'GitHub repo (auto-rebuild on push)',
      'Email support',
      'Uptime monitoring',
    ],
    cta: 'Get started',
    featured: true,
  },
  {
    name: 'Professional',
    price: '$39',
    period: '/mo',
    description: 'Custom domain, priority support, and hands-on help.',
    features: [
      'Everything in Starter',
      'Custom domain setup (yourbusiness.com)',
      'Priority support',
      'Monthly content updates by our team',
      'Advanced template customization',
      'Performance optimization',
    ],
    cta: 'Get started',
    featured: false,
  },
]

const faqs = [
  {
    q: 'Do I own my code?',
    a: 'Yes — always. Your project is a standard Vite/React app. Download it as a ZIP, clone from GitHub, or deploy it yourself anywhere.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel your subscription and your site stays up until the end of the billing period. Your code is always yours to keep.',
  },
  {
    q: 'What happens on the free tier?',
    a: 'You can create, customize, and preview your site inside the app. Your site is private (not public) until you upgrade.',
  },
  {
    q: 'How fast is the site built?',
    a: 'About 2 seconds. Pick a template, fill in your business info, and your preview is ready instantly.',
  },
  {
    q: 'Can I use my own domain?',
    a: 'Yes, on the Professional plan. We handle the DNS setup and SSL certificate for you.',
  },
]

export function PricingPage() {
  const faqRef = useScrollReveal<HTMLDivElement>()

  useDocumentMeta({
    title: 'Pricing — Create Your Business Website from $0 | CodeBG',
    description:
      'Start free. Create your business website in seconds from 6 templates. Pay $19/mo for public hosting. Own your code.',
  })

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="section-card p-8 md:p-10">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Pricing' }]} />

        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-50 md:text-4xl">
          Simple pricing. Start free. Own your code.
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700 dark:text-slate-300">
          Create your business website for free. Preview it instantly. Pay only when you want a public URL. No setup
          fees, no surprises.
        </p>
      </div>

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
                <Link to="/login">{tier.cta}</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <div ref={faqRef} className="section-card reveal-fade-up p-8 md:p-10">
        <h2 className="section-heading">Frequently asked</h2>
        <div className="mt-6 space-y-6">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100">{faq.q}</h3>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>

      <p>
        <Link to="/" className="text-sm font-medium text-accent hover:underline">
          &larr; Back to CodeBG
        </Link>
      </p>
    </div>
  )
}
