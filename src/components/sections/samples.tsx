import { Section } from '../ui/section'
import { Card } from '../ui/card'
import { CtaLink } from '../ui/cta-link'
import { Carousel } from '../ui/carousel'
import type { SampleEntry } from '../../types'

interface SamplesProps {
  samples: SampleEntry[]
}

export function Samples({ samples }: SamplesProps) {
  return (
    <Section
      id="samples"
      heading="Sample sites by business type"
      description="Explore live examples and pick the structure that best matches your business."
      headerRight={<CtaLink href="https://sample-apps.codebg.com/">View all samples</CtaLink>}
    >
      {/* Desktop grid */}
      <div className="mt-6 hidden md:grid gap-5 sm:grid-cols-2 xl:grid-cols-3 stagger-children">
        {samples.map((sample) => (
          <SampleCard key={sample.slug} sample={sample} />
        ))}
      </div>

      {/* Mobile carousel */}
      <div className="mt-6 md:hidden">
        <Carousel autoPlay interval={4000} showArrows={false}>
          {samples.map((sample) => (
            <div key={sample.slug} className="px-1">
              <SampleCard sample={sample} />
            </div>
          ))}
        </Carousel>
      </div>
    </Section>
  )
}

function SampleCard({ sample }: { sample: SampleEntry }) {
  return (
    <Card as="article" className="overflow-hidden p-0">
      {sample.thumbnail ? (
        <img
          src={sample.thumbnail}
          alt={`${sample.title} website sample`}
          loading="lazy"
          className="h-32 w-full bg-slate-100 dark:bg-slate-700 object-cover"
        />
      ) : (
        <div className="h-32 bg-slate-100 dark:bg-slate-700" />
      )}
      <div className="p-5">
        <p className="text-xs uppercase tracking-wide text-accent-text dark:text-orange-400">Sample</p>
        <h3 className="mt-1 font-semibold text-slate-800 dark:text-slate-100">{sample.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">{sample.description}</p>
        {sample.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {sample.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 text-xs text-indigo-700 dark:text-indigo-300">{tag}</span>
            ))}
          </div>
        ) : null}
        <CtaLink href={`https://sample-apps.codebg.com/${sample.slug}/`} className="mt-4 inline-block">
          Open sample
        </CtaLink>
      </div>
    </Card>
  )
}
