import { useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { Button } from '../ui/button'
import { navLinks } from '../../data/nav-links'
import { useThemeContext } from '../../contexts/theme-context'
import { useActiveSection } from '../../hooks/use-active-section'
import { cn } from '../../lib/utils'

const sectionIds = ['about', 'services', 'process', 'samples', 'news', 'pricing', 'contact']

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useThemeContext()
  const { pathname } = useLocation()

  const isHome = pathname === '/'
  const stableSectionIds = useMemo(() => sectionIds, [])
  const activeSection = useActiveSection(isHome ? stableSectionIds : [])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const handleContactClick = () => {
    closeMobileMenu()
    if (isHome) {
      document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.location.href = '/#contact'
    }
  }

  return (
    <header className="sticky top-0 z-10 border-b border-slate-700 bg-shell text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="text-lg font-semibold tracking-wide">
          Code<span className="text-accent">BG</span>
        </a>

        <nav className="hidden gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-accent',
                isHome && activeSection === link.href.replace('/#', '') && 'font-medium text-accent',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <Button size="default" className="hidden md:inline-flex" onClick={handleContactClick}>
            Contact
          </Button>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 md:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav className="mobile-nav-enter border-t border-slate-700 px-6 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/10 hover:text-accent',
                  isHome && activeSection === link.href.replace('/#', '') && 'font-medium text-accent',
                )}
                onClick={closeMobileMenu}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 border-t border-slate-700 pt-3">
              <Button size="default" className="w-full" onClick={handleContactClick}>
                Get started
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
