import { Layout, Smartphone, Rocket } from 'lucide-react'
import { Section } from '../ui/section'
import { Card } from '../ui/card'
import { CtaLink } from '../ui/cta-link'
import { services } from '../../data/services'

const iconMap: Record<string, React.ReactNode> = {
  Layout: <Layout size={20} />,
  Smartphone: <Smartphone size={20} />,
  Rocket: <Rocket size={20} />,
}

export function Services() {
  return (
    <Section id="services" heading="What's included" headerRight={<CtaLink href="/services">All services</CtaLink>}>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3 stagger-children">
        {services.map((svc) => (
          <Card as="article" key={svc.slug}>
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft text-accent dark:bg-orange-950/50 dark:text-orange-400">
              {iconMap[svc.icon]}
            </div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-100">{svc.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{svc.summary}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
