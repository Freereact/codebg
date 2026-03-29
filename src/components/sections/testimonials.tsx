import { MessageCircle, Star } from 'lucide-react'
import { Section } from '../ui/section'
import { Card } from '../ui/card'
import { Button } from '../ui/button'

interface TestimonialsProps {
  onContactClick: () => void
}

export function Testimonials({ onContactClick }: TestimonialsProps) {
  return (
    <Section id="testimonials" heading="Testimonials">
      <div className="mt-6 flex flex-col items-center gap-6 text-center">
        <Card className="mx-auto max-w-lg">
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex gap-1 text-slate-300 dark:text-slate-600">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={20} />
              ))}
            </div>
            <MessageCircle size={40} className="text-slate-300 dark:text-slate-600" />
            <p className="text-lg italic text-slate-500 dark:text-slate-400">
              "Our first review is still loading&hellip;"
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500">
              We're a new studio growing one project at a time. Our testimonials section is a bit empty — but our
              enthusiasm is full.
            </p>
          </div>
        </Card>
        <p className="text-slate-600 dark:text-slate-400">Want to be our first happy client?</p>
        <Button size="lg" onClick={onContactClick}>
          Let's build something together
        </Button>
      </div>
    </Section>
  )
}
