export function Footer() {
  return (
    <footer className="border-t border-slate-700 bg-shell text-slate-300">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <div className="text-lg font-semibold text-white">
              Code<span className="text-accent">BG</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">Simple web development for Canadian businesses.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <a href="/#services" className="transition-colors hover:text-accent">Services</a>
            <a href="/#samples" className="transition-colors hover:text-accent">Samples</a>
            <a href="/#pricing" className="transition-colors hover:text-accent">Pricing</a>
            <a href="/#contact" className="transition-colors hover:text-accent">Contact</a>
          </nav>
        </div>
        <div className="mt-6 border-t border-slate-700 pt-5 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} CodeBG &mdash; simple web development.
        </div>
      </div>
    </footer>
  )
}
