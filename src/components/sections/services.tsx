import { Section } from '../ui/section'
import { Card } from '../ui/card'
import { services } from '../../data/services'

export function Services() {
  return (
    <Section id="services" heading="What's included">
      <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
        {services.map(([title, desc]) => (
          <Card as="article" key={title}>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
          </Card>
        ))}
      </div>
    </Section>
  )
}
