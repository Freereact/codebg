import { useEffect, useRef, useState } from 'react'
import { Button } from './components/ui/button'
import heroBg from './assets/hero-bg.webp'

type FormState = {
  name: string
  email: string
  message: string
}

const initialForm: FormState = { name: '', email: '', message: '' }

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

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-10 border-b border-slate-700 bg-[#2a2f36] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold tracking-wide">
            Code<span className="text-orange-500">BG</span>
          </div>
          <nav className="hidden gap-6 text-sm md:flex">
            <a href="#about" className="hover:text-orange-400">About</a>
            <a href="#services" className="hover:text-orange-400">Services</a>
            <a href="#process" className="hover:text-orange-400">Process</a>
            <a href="#pricing" className="hover:text-orange-400">Pricing</a>
            <a href="#contact" className="hover:text-orange-400">Contact</a>
          </nav>
          <Button size="default" onClick={scrollToContact}>Contact</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-10">
        <section
          id="about"
          className="section-card relative overflow-hidden p-8 md:p-12"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/84 via-white/80 to-[#f6f6f3]/94 backdrop-blur-[2px]" />
          <div className="relative max-w-3xl rounded-2xl border border-white/70 bg-white/78 p-6 shadow-lg backdrop-blur-sm md:p-8">
            <p className="mb-3 inline-flex rounded-full border border-orange-300 bg-orange-50/95 px-3 py-1 text-xs font-medium text-orange-700">
              Canadian web development
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Professional one-page websites, built in a weekend.
            </h1>
            <p className="mt-4 text-slate-800">
              We deliver fast, clean, low-maintenance websites for Canadian businesses. Built with modern tooling,
              practical UX, and clear communication from start to launch.
            </p>
            <div className="mt-6">
              <Button size="lg" onClick={scrollToContact}>Get your site started</Button>
            </div>
          </div>
        </section>

        <section id="services" className="section-card p-8">
          <h2 className="text-2xl font-semibold text-slate-800">What’s included</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['Single-page structure', 'A focused 5-section layout tailored to your business goals.'],
              ['Mobile-first design', 'Built to look clean and readable on modern phones and desktops.'],
              ['Fast deployment', 'Versioned delivery with CI-ready workflow for future updates.'],
            ].map(([title, desc]) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="process" className="section-card p-8">
          <h2 className="text-2xl font-semibold text-slate-800">How we build</h2>
          <p className="mt-2 text-slate-600">
            We build with{' '}
            <span className="underline decoration-dotted" title="OpenClaw lets experts orchestrate AI-assisted development safely and quickly.">
              <a href="https://openclaw.ai/" target="_blank" rel="noreferrer" className="text-orange-700 hover:text-orange-800">
                OpenClaw
              </a>
            </span>{' '}
            and AI under expert supervision, backed by 10+ years of web development experience.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {[
              ['1. Brief', 'We clarify your offer, audience, and goals.'],
              ['2. Draft', 'We shape the sections and messaging for conversion.'],
              ['3. Build', 'We implement a polished, performant single-page site.'],
              ['4. Launch', 'You review, approve, and go live quickly.'],
            ].map(([step, desc]) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-800">{step}</p>
                <p className="mt-1 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="pricing" className="section-card p-8">
          <h2 className="text-2xl font-semibold text-slate-800">Pricing</h2>
          <div className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 p-6">
            <p className="text-sm uppercase tracking-wide text-orange-700">Starting price</p>
            <p className="mt-1 text-4xl font-bold text-slate-900">From $99</p>
            <p className="mt-2 text-slate-700">Single-page, 5-section website. A weekend project, professionally delivered.</p>
          </div>
          <div className="mt-5">
            <Button onClick={scrollToContact}>Request your build</Button>
          </div>
        </section>

        <section id="contact" className="section-card p-8">
          <h2 className="text-2xl font-semibold text-slate-800">Contact</h2>
          <p className="mt-2 text-slate-600">Tell us what you need. We’ll reply with a practical plan.</p>
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={openCaptcha}>
            <label className="space-y-1">
              <span className="text-sm text-slate-600">Name</span>
              <input className="input" name="name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-slate-600">Email</span>
              <input className="input" type="email" name="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm text-slate-600">Project summary</span>
              <textarea className="input min-h-28" name="message" value={form.message} onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))} required />
            </label>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit">Send request</Button>
              {sent && <span className="text-sm text-emerald-700">Thanks — request queued successfully.</span>}
            </div>
            {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
          </form>
        </section>
      </main>

      {showCaptchaModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
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

      <footer className="border-t border-slate-700 bg-[#2a2f36] px-6 py-5 text-center text-sm text-slate-300">
        © {new Date().getFullYear()} CodeBG — simple web development.
      </footer>
    </div>
  )
}
