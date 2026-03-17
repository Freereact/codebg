import { useState } from 'react'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { Button } from '../ui/button'
import { navLinks } from '../../data/nav-links'
import { cn } from '../../lib/utils'

interface HeaderProps {
  activeSection?: string
  onContactClick?: () => void
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
}

export function Header({ activeSection, onContactClick, theme, onToggleTheme }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const closeMobileMenu = () => setMobileMenuOpen(false)

  return (
    <header className="sticky top-0 z-10 border-b border-slate-700 bg-shell text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="text-lg font-semibold tracking-wide">
          Code<span className="text-accent">BG</span>
        </div>

        <nav className="hidden gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-accent',
                activeSection === link.href.replace('/#', '') && 'font-medium text-accent',
              )}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {onToggleTheme && (
            <button
              onClick={onToggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          )}

          {onContactClick ? (
            <Button size="default" onClick={onContactClick} className="hidden md:inline-flex">
              Contact
            </Button>
          ) : (
            <Button size="default" asChild className="hidden md:inline-flex">
              <a href="/#contact">Contact</a>
            </Button>
          )}

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
                  activeSection === link.href.replace('/#', '') && 'font-medium text-accent',
                )}
                onClick={closeMobileMenu}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 border-t border-slate-700 pt-3">
              {onContactClick ? (
                <Button size="default" className="w-full" onClick={() => { closeMobileMenu(); onContactClick() }}>
                  Get started
                </Button>
              ) : (
                <Button size="default" asChild className="w-full" onClick={closeMobileMenu}>
                  <a href="/#contact">Get started</a>
                </Button>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
