import { Facebook, Instagram, Linkedin } from 'lucide-react'

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Instagram, href: '#', label: 'Instagram' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
]

export function Footer() {
  return (
    <footer className="border-t border-slate-700 bg-shell text-slate-300">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <div className="text-lg font-semibold text-white">
              Code<span className="text-accent">BG</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">Low-cost AI web development for Canadian businesses.</p>
          </div>
          <div className="flex flex-col items-center gap-4 sm:items-end">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
              <a href="/#services" className="transition-colors hover:text-accent">Services</a>
              <a href="/#samples" className="transition-colors hover:text-accent">Samples</a>
              <a href="/#pricing" className="transition-colors hover:text-accent">Pricing</a>
              <a href="/#contact" className="transition-colors hover:text-accent">Contact</a>
            </nav>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="text-slate-400 transition-colors hover:text-accent"
                >
                  <s.icon size={18} />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-6 border-t border-slate-700 pt-5 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} CodeBG &mdash; affordable AI web development.
        </div>
      </div>
    </footer>
  )
}
