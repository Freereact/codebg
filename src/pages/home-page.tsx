import { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import { Hero } from '../components/sections/hero'
import { Services } from '../components/sections/services'
import { Process } from '../components/sections/process'
import { Samples } from '../components/sections/samples'
import { News } from '../components/sections/news'
import { Pricing } from '../components/sections/pricing'
import { SeoResources } from '../components/sections/seo-resources'
import { Contact } from '../components/sections/contact'
import { fallbackSamples } from '../data/samples'
import type { SampleEntry } from '../types'
import type { ContactOutletContext } from '../components/layout/root-layout'

export function HomePage() {
  const [samples, setSamples] = useState<SampleEntry[]>(fallbackSamples)
  const {
    scrollToContact,
    handleContactSubmit,
    sent,
    error,
  } = useOutletContext<ContactOutletContext>()

  useEffect(() => {
    let mounted = true

    async function loadSamples() {
      try {
        const res = await fetch('https://sample-apps.codebg.com/samples.json', { cache: 'no-store' })
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
      <Hero onContactClick={scrollToContact} />
      <Services />
      <Process />
      <Samples samples={samples} />
      <News />
      <Pricing onContactClick={scrollToContact} />
      <SeoResources />
      <Contact onSubmit={handleContactSubmit} sent={sent} error={error} />
    </div>
  )
}
