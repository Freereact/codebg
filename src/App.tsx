import { useEffect, useRef, useState } from 'react'
import { Button } from './components/ui/button'
import heroBg from './assets/hero-bg.webp'

type FormState = {
  name: string
  email: string
  message: string
}

const initialForm: FormState = { name: '', email: '', message: '' }

type SampleEntry = {
  slug: string
  title: string
  description: string
  tags?: string[]
  thumbnail?: string
}

const fallbackSamples: SampleEntry[] = [
  { slug: 'autoshop', title: 'Auto shop', description: 'Services, trust points, reviews, location, CTA.', tags: ['hero','services','testimonials','location'], thumbnail: '/customers/autoshop/assets/autoshop-hero-CQViJQB6.jpg' },
  { slug: 'dental-cabinet', title: 'Dental cabinet', description: 'Service highlights, practitioner trust, reviews, contact.', tags: ['hero','benefits','reviews','contact'] },
  { slug: 'winery', title: 'Winery', description: 'Featured products, story, social proof, visit info.', tags: ['hero','products','story','visit'] },
  { slug: 'massage-service', title: 'Massage service', description: 'Treatments, process, pricing, testimonials, location.', tags: ['hero','pricing','testimonials','location'], thumbnail: '/customers/massage-service/assets/massage-hero-C2NIHe0G.jpg' },
  { slug: 'bakery-service', title: 'Bakery service', description: 'Menu highlights, testimonials, hours, location.', tags: ['hero','menu','reviews','hours'], thumbnail: '/customers/bakery-service/assets/bakery-hero-DmIi84jx.jpg' },
]

const navLinks = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#process', label: 'Process' },
  { href: '#samples', label: 'Samples' },
  { href: '#news', label: 'News' },
  { href: '#pricing', label: 'Pricing' },
  { href: '#contact', label: 'Contact' },
]

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('turnstile_script_load_failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.turnstile = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('turnstile_script_load_failed'))
    document.head.appendChild(script)
  })
}

export default function App() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [showCaptchaModal, setShowCaptchaModal] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [captchaStatus, setCaptchaStatus] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle')
  const [samples, setSamples] = useState<SampleEntry[]>(fallbackSamples)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const widgetIdRef = useRef<string | null>(null)

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'https://codebg.com'
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  useEffect(() => {
    let cancelled = false

    async function initTurnstile() {
      if (!showCaptchaModal) return

      if (!siteKey) {
        setCaptchaStatus('failed')
        setError('Turnstile site key is missing on frontend build.')
        return
      }

      setCaptchaStatus('loading')

      try {
        await loadTurnstileScript()
        if (cancelled || !showCaptchaModal || !window.turnstile) return

        if (widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current)
          setCaptchaStatus('ready')
          return
        }

        widgetIdRef.current = window.turnstile.render('#turnstile-widget', {
          sitekey: siteKey,
          callback: (token: string) => {
            setTurnstileToken(token)
            setCaptchaStatus('ready')
          },
          'expired-callback': () => setTurnstileToken(''),
        })

        setCaptchaStatus('ready')
      } catch {
        if (!cancelled) {
          setCaptchaStatus('failed')
          setError('Security widget failed to load. Please refresh and try again.')
        }
      }
    }

    void initTurnstile()
    return () => {
      cancelled = true
    }
  }, [showCaptchaModal, siteKey])

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

  const openCaptcha = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSent(false)

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all fields before verification.')
      return
    }
    if (form.message.trim().length < 3) {
      setError('Project summary must be at least 3 characters.')
      return
    }

    setTurnstileToken('')
    setShowCaptchaModal(true)
  }

  const submitVerified = async () => {
    if (!turnstileToken) {
      setError('Complete the verification challenge first.')
      return
    }

    setSending(true)
    setError('')

    try {
      const res = await fetch(`${apiBase}/api/email-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          turnstileToken,
        }),
      })

      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Failed to submit request.')
        return
      }

      setSent(true)
      setForm(initialForm)
      setTurnstileToken('')
      setShowCaptchaModal(false)
      if (window.turnstile && widgetIdRef.current) window.turnstile.reset(widgetIdRef.current)
    } catch {
      setError('Network error while sending request.')
    } finally {
      setSending(false)
    }
  }

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-700 bg-[#2a2f36] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold tracking-wide">
            Code<span className="text-orange-500">BG</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden gap-6 text-sm md:flex">
            {navLinks.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-orange-400">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Button size="default" onClick={scrollToContact} className="hidden md:inline-flex">
              Contact
            </Button>

            {/* Mobile hamburger */}
            <button
              className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 md:hidden"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <nav className="mobile-nav-enter border-t border-slate-700 px-6 pb-4 md:hidden">
            <div className="flex flex-col gap-1 pt-2">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/10 hover:text-orange-400"
                  onClick={closeMobileMenu}
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 border-t border-slate-700 pt-3">
                <Button size="default" className="w-full" onClick={() => { closeMobileMenu(); scrollToContact() }}>
                  Get started
                </Button>
              </div>
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 md:px-6 md:py-12">

        {/* Hero / About */}
        <section
          id="about"
          className="section-card relative overflow-hidden p-8 md:p-14"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#f6f6f3]/94 via-[#f6f6f3]/92 to-[#f6f6f3]/96 backdrop-blur-[3px]" />
          <div className="relative max-w-3xl rounded-2xl border border-white/80 bg-[#f6f6f3]/90 p-6 shadow-lg backdrop-blur-sm md:p-10">
            <p className="mb-3 inline-flex rounded-full border border-orange-300 bg-orange-50/95 px-3 py-1 text-xs font-medium text-orange-700">
              Canadian web development
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl lg:text-[3.25rem]">
              Professional one-page websites, built in a weekend.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-700 md:text-xl">
              We deliver fast, clean, low-maintenance websites for Canadian businesses. Built with modern tooling,
              practical UX, and clear communication from start to launch.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={scrollToContact}>Get your site started</Button>
              <Button size="lg" variant="ghost" asChild>
                <a href="#samples">View samples</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Services */}
        <section id="services" className="section-card p-8 md:p-10">
          <h2 className="section-heading">What's included</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {[
              ['Single-page structure', 'A focused 5-section layout tailored to your business goals.'],
              ['Mobile-first design', 'Built to look clean and readable on modern phones and desktops.'],
              ['Fast deployment', 'Versioned delivery with CI-ready workflow for future updates.'],
            ].map(([title, desc]) => (
              <article key={title} className="card-hover rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Process */}
        <section id="process" className="section-card p-8 md:p-10">
          <h2 className="section-heading">How we build</h2>
          <p className="mt-4 text-slate-600">
            We build with{' '}
            <a
              href="https://openclaw.ai/"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-dotted text-orange-700 hover:text-orange-800"
              title="OpenClaw lets experts orchestrate AI-assisted development safely and quickly."
            >
              OpenClaw
            </a>{' '}
            and AI under expert supervision, backed by 10+ years of web development experience.
          </p>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-4">
            {[
              ['1. Brief', 'We clarify your offer, audience, and goals.'],
              ['2. Draft', 'We shape the sections and messaging for conversion.'],
              ['3. Build', 'We implement a polished, performant single-page site.'],
              ['4. Launch', 'You review, approve, and go live quickly.'],
            ].map(([step, desc]) => (
              <div key={step} className="card-hover rounded-2xl border border-slate-200 bg-white p-5">
                <p className="font-medium text-slate-800">{step}</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Samples */}
        <section id="samples" className="section-card p-8 md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-heading">Sample sites by business type</h2>
              <p className="mt-4 text-slate-600">
                Explore live examples and pick the structure that best matches your business.
              </p>
            </div>
            <a href="/customers/" className="text-sm font-medium text-orange-700 hover:text-orange-800">View all samples &rarr;</a>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {samples.map((sample) => (
              <article key={sample.slug} className="card-hover overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div
                  className="h-32 bg-slate-100 bg-cover bg-center"
                  style={sample.thumbnail ? { backgroundImage: `url(${sample.thumbnail})` } : undefined}
                />
                <div className="p-5">
                  <p className="text-xs uppercase tracking-wide text-orange-700">Sample</p>
                  <h3 className="mt-1 font-semibold text-slate-800">{sample.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{sample.description}</p>
                  {sample.tags?.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {sample.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">{tag}</span>
                      ))}
                    </div>
                  ) : null}
                  <a href={`/customers/${sample.slug}/`} className="mt-4 inline-block text-sm font-medium text-orange-700 hover:text-orange-800">
                    Open sample &rarr;
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* News */}
        <section id="news" className="section-card p-8 md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="section-heading">News</h2>
              <p className="mt-4 text-slate-600">Latest updates from our stack, tools, and workflows.</p>
            </div>
            <a href="/news/nemoclaw-by-nvidia.html" className="text-sm font-medium text-orange-700 hover:text-orange-800">View latest post &rarr;</a>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            <article className="card-hover rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-wide text-orange-700">Mar 2026 &middot; NVIDIA</p>
              <h3 className="mt-1 font-semibold text-slate-800">NemoClaw (OpenClaw plugin): what's confirmed</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Verified summary of NVIDIA NemoClaw in OpenClaw deployment context.</p>
              <a href="/news/nemoclaw-by-nvidia.html" className="mt-3 inline-block text-sm font-medium text-orange-700 hover:text-orange-800">Read article &rarr;</a>
            </article>

            <article className="card-hover rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-wide text-orange-700">Platform</p>
              <h3 className="mt-1 font-semibold text-slate-800">Sample catalog now updates dynamically</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Main site sample cards now load from a shared JSON catalog for faster updates.</p>
              <a href="/customers/index.html" className="mt-3 inline-block text-sm font-medium text-orange-700 hover:text-orange-800">Open samples &rarr;</a>
            </article>

            <article className="card-hover rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs uppercase tracking-wide text-orange-700">SEO</p>
              <h3 className="mt-1 font-semibold text-slate-800">New local service pages are live</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">Added focused pages for Penticton web design and small business redesign.</p>
              <a href="/services/web-design-penticton.html" className="mt-3 inline-block text-sm font-medium text-orange-700 hover:text-orange-800">Read page &rarr;</a>
            </article>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="section-card p-8 md:p-10">
          <h2 className="section-heading">Pricing</h2>
          <div className="mt-6 rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 p-8">
            <p className="text-sm font-medium uppercase tracking-wide text-orange-700">Starting price</p>
            <p className="mt-2 text-5xl font-bold text-slate-900">From $49</p>
            <p className="mt-3 max-w-lg text-slate-700">Single-page, 5-section website. A weekend project, professionally delivered.</p>
            <div className="mt-6">
              <Button size="lg" onClick={scrollToContact}>Request your build</Button>
            </div>
          </div>
        </section>

        {/* SEO Resources */}
        <section id="seo" className="section-card p-8 md:p-10">
          <h2 className="section-heading">Local web design resources</h2>
          <p className="mt-4 text-slate-600">Helpful pages for search and planning your project.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <a className="card-hover rounded-xl border border-slate-200 bg-white p-5 hover:border-orange-300" href="/services/web-design-penticton.html">
              <p className="font-medium text-slate-800">Web Design Penticton, BC</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">What local businesses need from a modern website.</p>
            </a>
            <a className="card-hover rounded-xl border border-slate-200 bg-white p-5 hover:border-orange-300" href="/services/website-redesign.html">
              <p className="font-medium text-slate-800">Website Redesign Guide</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">How to improve clarity, UX, and conversion flow.</p>
            </a>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="section-card p-8 md:p-10">
          <h2 className="section-heading">Contact</h2>
          <p className="mt-4 text-slate-600">Tell us what you need. We'll reply with a practical plan.</p>
          <form className="mt-6 grid gap-5 md:grid-cols-2" onSubmit={openCaptcha}>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Name</span>
              <input className="input" name="name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input className="input" type="email" name="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Project summary</span>
              <textarea className="input min-h-32" name="message" value={form.message} onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))} required />
            </label>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit" size="lg">Send request</Button>
              {sent && <span className="text-sm font-medium text-emerald-700">Thanks — request queued successfully.</span>}
            </div>
            {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
          </form>
        </section>
      </main>

      {/* Captcha modal */}
      {showCaptchaModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-800">Verify and confirm</h3>
            <p className="mt-1 text-sm text-slate-600">Complete the security check, then confirm send.</p>
            <div id="turnstile-widget" className="mt-4 min-h-[72px]" />
            {captchaStatus === 'loading' && <p className="mt-2 text-xs text-slate-500">Loading security check…</p>}
            {captchaStatus === 'failed' && <p className="mt-2 text-xs text-red-600">Security widget failed to load. Try refreshing the page.</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => { setShowCaptchaModal(false); setTurnstileToken('') }}>Cancel</Button>
              <Button type="button" onClick={submitVerified} disabled={!turnstileToken || sending}>{sending ? 'Sending…' : 'Confirm send'}</Button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-[#2a2f36] text-slate-300">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <div className="text-lg font-semibold text-white">
                Code<span className="text-orange-500">BG</span>
              </div>
              <p className="mt-1 text-sm text-slate-400">Simple web development for Canadian businesses.</p>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <a href="#services" className="transition-colors hover:text-orange-400">Services</a>
              <a href="#samples" className="transition-colors hover:text-orange-400">Samples</a>
              <a href="#pricing" className="transition-colors hover:text-orange-400">Pricing</a>
              <a href="#contact" className="transition-colors hover:text-orange-400">Contact</a>
            </nav>
          </div>
          <div className="mt-6 border-t border-slate-700 pt-5 text-center text-sm text-slate-500">
            © {new Date().getFullYear()} CodeBG — simple web development.
          </div>
        </div>
      </footer>
    </div>
  )
}
