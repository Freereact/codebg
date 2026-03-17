import { useEffect, useState } from 'react'
import { Section } from '../components/ui/section'
import { Card } from '../components/ui/card'
import { CtaLink } from '../components/ui/cta-link'
import { useDocumentMeta } from '../hooks/use-document-meta'
import { fallbackSamples } from '../data/samples'
import type { SampleEntry } from '../types'

export function CustomersIndexPage() {
  const [samples, setSamples] = useState<SampleEntry[]>(fallbackSamples)

  useDocumentMeta({
    title: 'Samples | CodeBG',
    description: 'Explore live examples and pick the structure that best matches your business.',
  })

  useEffect(() => {
    let mounted = true

    async function loadSamples() {
      try {
        const res = await fetch('/customers/samples.json', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { samples?: SampleEntry[] }
        if (mounted && data.samples && data.samples.length) {
          setSamples(data.samples)
        }
      } catch {
        // keep fallback samples
      }
    }

    void loadSamples()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <Section
        id="samples"
        heading="Sample sites by business type"
        description="Explore live examples and pick the structure that best matches your business."
      >
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {samples.map((sample) => (
            <Card as="article" key={sample.slug} className="overflow-hidden p-0">
              <div
                className="h-32 bg-slate-100 dark:bg-slate-700 bg-cover bg-center"
                style={sample.thumbnail ? { backgroundImage: `url(${sample.thumbnail})` } : undefined}
              />
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
                <CtaLink href={`/customers/${sample.slug}/`} className="mt-4 inline-block">
                  Open sample
                </CtaLink>
              </div>
            </Card>
          ))}
        </div>
      </Section>
    </div>
  )
}
