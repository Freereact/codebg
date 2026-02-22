import { useState } from 'react'
import { Button } from './components/ui/button'
import heroBg from './assets/hero-bg.webp'

export default function App() {
  const [sent, setSent] = useState(false)

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
        <section
          className="section-card relative overflow-hidden p-8 md:p-12"
          style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/76 to-[#f6f6f3]/92 backdrop-blur-[2px]" />
          <div className="relative max-w-3xl rounded-2xl border border-white/70 bg-white/72 p-6 shadow-lg backdrop-blur-sm md:p-8">
            <p className="mb-3 inline-flex rounded-full border border-orange-300 bg-orange-50/95 px-3 py-1 text-xs font-medium text-orange-700">
              Low-maintenance web development
            </p>
            <h1 className="text-4xl font-bold leading-tight text-slate-900 md:text-5xl">
              Build fast. Stay simple. Grow with confidence.
            </h1>
            <p className="mt-4 max-w-3xl text-slate-800">
              CodeBG builds clean, TypeScript-first web apps with practical UX and long-term maintainability.
              We focus on shipping value fast without creating future technical debt.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button size="lg">Start your project</Button>
              <Button variant="ghost" size="lg">See pricing approach</Button>
            </div>
          </div>
        </section>

        <section id="services" className="section-card p-8">
          <h2 className="text-2xl font-semibold text-slate-800">Services</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            {[
              ['Web Apps', 'SPA development with React, TypeScript, and scalable component architecture.'],
              ['Landing + Marketing', 'High-conversion pages with clean design, fast load, and SEO-ready structure.'],
              ['Ongoing Support', 'Small iterative improvements, maintenance, and technical guidance.'],
            ].map(([title, desc]) => (
              <article key={title} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="font-semibold text-slate-800">{title}</h3>
                <p className="mt-2 text-sm text-slate-600">{desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="process" className="section-card p-8">
          <h2 className="text-2xl font-semibold text-slate-800">Process</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-4">
            {[
              ['1. Discover', 'Goals, users, and constraints'],
              ['2. Design', 'Simple UI system and content'],
              ['3. Build', 'Type-safe implementation + review'],
              ['4. Launch', 'Deploy, monitor, and iterate'],
            ].map(([step, desc]) => (
              <div key={step} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-800">{step}</p>
                <p className="mt-1 text-sm text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="work" className="section-card p-8">
          <h2 className="text-2xl font-semibold text-slate-800">What you get</h2>
          <ul className="mt-4 grid gap-3 text-slate-700 md:grid-cols-2">
            <li className="rounded-xl border border-slate-200 bg-white p-4">Modern Vite + React + TypeScript stack</li>
            <li className="rounded-xl border border-slate-200 bg-white p-4">Readable codebase, documented handoff</li>
            <li className="rounded-xl border border-slate-200 bg-white p-4">Performance-focused front-end structure</li>
            <li className="rounded-xl border border-slate-200 bg-white p-4">CI/CD-friendly workflow for easy updates</li>
          </ul>
        </section>

        <section id="contact" className="section-card p-8">
          <h2 className="text-2xl font-semibold text-slate-800">Contact</h2>
          <p className="mt-2 text-slate-600">Tell us what you need. We’ll reply with a practical plan.</p>

          <form
            className="mt-5 grid gap-4 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault()
              setSent(true)
            }}
          >
            <label className="space-y-1">
              <span className="text-sm text-slate-600">Name</span>
              <input className="input" name="name" required />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-slate-600">Email</span>
              <input className="input" type="email" name="email" required />
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm text-slate-600">Project summary</span>
              <textarea className="input min-h-28" name="message" required />
            </label>
            <div className="md:col-span-2 flex items-center gap-3">
              <Button type="submit">Send request</Button>
              {sent && <span className="text-sm text-emerald-700">Thanks — message captured. We’ll follow up soon.</span>}
            </div>
          </form>
        </section>
      </main>

      <footer className="border-t border-slate-700 bg-[#2a2f36] px-6 py-5 text-center text-sm text-slate-300">
        © {new Date().getFullYear()} CodeBG — simple web development.
      </footer>
    </div>
  )
}
