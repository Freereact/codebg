import { useEffect, useRef, useState } from 'react'
import { Button } from './components/ui/button'
import heroBg from './assets/hero-bg.webp'

type FormState = {
  name: string
  email: string
  message: string
}

const initialForm: FormState = { name: '', email: '', message: '' }

export default function App() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [showCaptchaModal, setShowCaptchaModal] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const widgetIdRef = useRef<string | null>(null)

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'https://codebg.com'
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  useEffect(() => {
    if (!showCaptchaModal || !window.turnstile || widgetIdRef.current || !siteKey) return
    widgetIdRef.current = window.turnstile.render('#turnstile-widget', {
      sitekey: siteKey,
      callback: (token) => setTurnstileToken(token),
      'expired-callback': () => setTurnstileToken(''),
    })
  }, [showCaptchaModal, siteKey])

  const openCaptcha = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSent(false)
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all fields before verification.')
      return
    }
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

  return (
    <div className="app-shell">
      <header className="sticky top-0 z-10 border-b border-slate-700 bg-[#2a2f36] text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="text-lg font-semibold tracking-wide">
            Code<span className="text-orange-500">BG</span>
          </div>
          <nav className="hidden gap-6 text-sm md:flex">
            <a href="#services" className="hover:text-orange-400">Services</a>
            <a href="#process" className="hover:text-orange-400">Process</a>
            <a href="#work" className="hover:text-orange-400">Work</a>
            <a href="#contact" className="hover:text-orange-400">Contact</a>
          </nav>
          <Button size="default">Book Intro Call</Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 md:px-6 md:py-10">
        <section className="section-card relative overflow-hidden p-8 md:p-12" style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/76 to-[#f6f6f3]/92 backdrop-blur-[2px]" />
          <div className="relative max-w-3xl rounded-2xl border border-white/70 bg-white/72 p-6 shadow-lg backdrop-blur-sm md:p-8">
            <p className="mb-3 inline-flex rounded-full border border-orange-300 bg-orange-50/95 px-3 py-1 text-xs font-medium text-orange-700">Low-maintenance web development</p>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">Build fast. Stay simple. Grow with confidence.</h1>
            <p className="mt-4 max-w-3xl text-slate-800">CodeBG builds clean, TypeScript-first web apps with practical UX and long-term maintainability. We focus on shipping value fast without creating future technical debt.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg">Start your project</Button>
              <Button variant="ghost" size="lg">See pricing approach</Button>
            </div>
          </div>
        </section>

        <section id="services" className="section-card p-8"><h2 className="text-2xl font-semibold text-slate-800">Services</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{[['Web Apps', 'SPA development with React, TypeScript, and scalable component architecture.'],['Landing + Marketing', 'High-conversion pages with clean design, fast load, and SEO-ready structure.'],['Ongoing Support', 'Small iterative improvements, maintenance, and technical guidance.']].map(([title, desc]) => (<article key={title} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-semibold text-slate-800">{title}</h3><p className="mt-2 text-sm text-slate-600">{desc}</p></article>))}</div></section>
        <section id="process" className="section-card p-8"><h2 className="text-2xl font-semibold text-slate-800">Process</h2><div className="mt-5 grid gap-4 md:grid-cols-4">{[['1. Discover', 'Goals, users, and constraints'],['2. Design', 'Simple UI system and content'],['3. Build', 'Type-safe implementation + review'],['4. Launch', 'Deploy, monitor, and iterate']].map(([step, desc]) => (<div key={step} className="rounded-2xl border border-slate-200 bg-white p-4"><p className="font-medium text-slate-800">{step}</p><p className="mt-1 text-sm text-slate-600">{desc}</p></div>))}</div></section>
        <section id="work" className="section-card p-8"><h2 className="text-2xl font-semibold text-slate-800">What you get</h2><ul className="mt-4 grid gap-3 text-slate-700 md:grid-cols-2"><li className="rounded-xl border border-slate-200 bg-white p-4">Modern Vite + React + TypeScript stack</li><li className="rounded-xl border border-slate-200 bg-white p-4">Readable codebase, documented handoff</li><li className="rounded-xl border border-slate-200 bg-white p-4">Performance-focused front-end structure</li><li className="rounded-xl border border-slate-200 bg-white p-4">CI/CD-friendly workflow for easy updates</li></ul></section>

        <section id="contact" className="section-card p-8">
          <h2 className="text-2xl font-semibold text-slate-800">Contact</h2>
          <p className="mt-2 text-slate-600">Tell us what you need. We’ll reply with a practical plan. Or email <a className="font-medium text-orange-700 underline" href="mailto:web@codebg.com">web@codebg.com</a>.</p>
          <form className="mt-5 grid gap-4 md:grid-cols-2" onSubmit={openCaptcha}>
            <label className="space-y-1"><span className="text-sm text-slate-600">Name</span><input className="input" name="name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} required /></label>
            <label className="space-y-1"><span className="text-sm text-slate-600">Email</span><input className="input" type="email" name="email" value={form.email} onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))} required /></label>
            <label className="space-y-1 md:col-span-2"><span className="text-sm text-slate-600">Project summary</span><textarea className="input min-h-28" name="message" value={form.message} onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))} required /></label>
            <div className="md:col-span-2 flex items-center gap-3"><Button type="submit">Send request</Button>{sent && <span className="text-sm text-emerald-700">Thanks — request queued successfully.</span>}</div>
            {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
          </form>
        </section>
      </main>

      {showCaptchaModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-800">Verify and confirm</h3>
            <p className="mt-1 text-sm text-slate-600">Complete the security check, then confirm send.</p>
            <div id="turnstile-widget" className="mt-4 min-h-16" />
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={() => { setShowCaptchaModal(false); setTurnstileToken('') }}>Cancel</Button>
              <Button type="button" onClick={submitVerified} disabled={!turnstileToken || sending}>{sending ? 'Sending…' : 'Confirm send'}</Button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-700 bg-[#2a2f36] px-6 py-5 text-center text-sm text-slate-300">© {new Date().getFullYear()} CodeBG — simple web development.</footer>
    </div>
  )
}
