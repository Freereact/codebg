import { Section } from '../ui/section'
import { Card } from '../ui/card'
import { Button } from '../ui/button'

interface PricingProps {
  onContactClick: () => void
}

export function Pricing({ onContactClick }: PricingProps) {
  return (
    <Section id="pricing" heading="Pricing">
      <div className="mt-6">
        <Card variant="featured">
          <p className="text-sm font-medium uppercase tracking-wide text-accent-text dark:text-orange-400">Starting price</p>
          <p className="mt-2 text-5xl font-bold text-slate-900 dark:text-slate-50">From $49</p>
          <p className="mt-3 max-w-lg text-slate-700 dark:text-slate-300">Single-page, 5-section website. A weekend project, professionally delivered.</p>
          <div className="mt-6">
            <Button size="lg" onClick={onContactClick}>Request your build</Button>
          </div>
        </Card>
      </div>
    </Section>
  )
}
