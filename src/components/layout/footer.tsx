import { useLocation } from 'react-router-dom'

interface FooterProps {
  onContactClick?: () => void
}

export function Footer({ onContactClick }: FooterProps) {
  const { pathname } = useLocation()
  const isHome = pathname === '/'
  return (
    <footer className="border-t border-slate-700 bg-shell text-slate-300">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <div className="text-lg font-semibold text-white">
              Code<span className="text-accent">BG</span>
            </div>
            <p className="mt-1 text-sm text-slate-400">Business websites you own. Built in seconds.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            <a href="/#services" className="transition-colors hover:text-accent">
              Services
            </a>
            <a href="/#samples" className="transition-colors hover:text-accent">
              Samples
            </a>
            <a href="/#pricing" className="transition-colors hover:text-accent">
              Pricing
            </a>
            {!isHome && onContactClick ? (
              <button onClick={onContactClick} className="transition-colors hover:text-accent">
                Contact
              </button>
            ) : (
              <a href="/#contact" className="transition-colors hover:text-accent">
                Contact
              </a>
            )}
          </nav>
        </div>
        <div className="mt-6 flex flex-col items-center gap-4 border-t border-slate-700 pt-5 text-center text-sm text-slate-500">
          <a
            href="https://www.digitalocean.com/?refcode=7f355a791090&utm_campaign=Referral_Invite&utm_medium=Referral_Program&utm_source=badge"
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src="https://web-platforms.sfo2.cdn.digitaloceanspaces.com/WWW/Badge%202.svg"
              alt="DigitalOcean Referral Badge"
              width="200"
              height="65"
              loading="lazy"
            />
          </a>
          <span>&copy; {new Date().getFullYear()} CodeBG</span>
        </div>
      </div>
    </footer>
  )
}
