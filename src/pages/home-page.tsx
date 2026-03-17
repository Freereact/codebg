import { useEffect, useState } from 'react'
import { Hero } from '../components/sections/hero'
import { Services } from '../components/sections/services'
import { Process } from '../components/sections/process'
import { Samples } from '../components/sections/samples'
import { News } from '../components/sections/news'
import { Pricing } from '../components/sections/pricing'
import { SeoResources } from '../components/sections/seo-resources'
import { Contact } from '../components/sections/contact'
import { CaptchaModal } from '../components/sections/captcha-modal'
import { useContactForm } from '../hooks/use-contact-form'
import { fallbackSamples } from '../data/samples'
import type { SampleEntry } from '../types'

export function HomePage() {
  const [samples, setSamples] = useState<SampleEntry[]>(fallbackSamples)
  const {
    scrollToContact,
    handleContactSubmit,
    submitVerified,
    closeCaptchaModal,
    showCaptchaModal,
    sending,
    sent,
    error,
    turnstileToken,
    captchaStatus,
  } = useContactForm()

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
    <>
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

      <CaptchaModal
        open={showCaptchaModal}
        onClose={closeCaptchaModal}
        onConfirm={submitVerified}
        sending={sending}
        turnstileToken={turnstileToken}
        captchaStatus={captchaStatus}
      />
    </>
  )
}
