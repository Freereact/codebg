import { useEffect, useMemo, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { Menu, X, Sun, Moon } from 'lucide-react'
import { Button } from '../ui/button'
import { navLinks } from '../../data/nav-links'
import { useThemeContext } from '../../hooks/use-theme'
import { useAuth } from '../../hooks/use-auth'
import { useActiveSection } from '../../hooks/use-active-section'
import { cn } from '../../lib/utils'
import { IS_TEST } from '../../lib/config'

const sectionIds = ['about', 'services', 'process', 'samples', 'news', 'pricing', 'contact']

interface HeaderProps {
  onContactClick: () => void
}

export function Header({ onContactClick }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useThemeContext()
  const { state: authState } = useAuth()
  const { pathname } = useLocation()
  const isAuthenticated = authState.status === 'authenticated'
  const isAdmin = isAuthenticated && authState.user.role === 'admin'

  const isHome = pathname === '/'
  const stableSectionIds = useMemo(() => sectionIds, [])
  const activeSection = useActiveSection(isHome ? stableSectionIds : [])

  const closeMobileMenu = () => setMobileMenuOpen(false)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) closeMobileMenu()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileMenuOpen])

  const handleContactClick = () => {
    closeMobileMenu()
    onContactClick()
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isHome && href === '/#contact') {
      e.preventDefault()
      handleContactClick()
    } else {
      closeMobileMenu()
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700 bg-shell text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="text-lg font-semibold tracking-wide">
          Code<span className="text-accent">BG</span>
          {IS_TEST && (
            <span className="ml-2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">
              test
            </span>
          )}
        </Link>

        <nav className="hidden gap-6 text-sm md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
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

          {isAdmin && (
            <Link
              to="/admin"
              className="hidden h-10 items-center rounded-md bg-accent/20 px-4 text-sm font-medium text-accent transition-colors hover:bg-accent/30 md:inline-flex"
            >
              Admin
            </Link>
          )}

          <Link
            to={isAuthenticated ? '/portal/dashboard' : '/login'}
            className="hidden h-10 items-center rounded-md border border-white/30 px-4 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10 md:inline-flex"
          >
            {isAuthenticated ? 'Dashboard' : 'Sign in'}
          </Link>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 md:hidden"
            onClick={() => setMobileMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <nav id="mobile-nav" className="mobile-nav-enter border-t border-slate-700 px-6 pb-4 md:hidden">
          <div className="flex flex-col gap-1 pt-2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={cn(
                  'rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-white/10 hover:text-accent',
                  isHome && activeSection === link.href.replace('/#', '') && 'font-medium text-accent',
                )}
                onClick={(e) => handleNavClick(e, link.href)}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-slate-700 pt-3">
              <Button size="default" className="w-full" onClick={handleContactClick}>
                Get started
              </Button>
              <Link
                to={isAuthenticated ? '/portal/dashboard' : '/login'}
                onClick={closeMobileMenu}
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-white/30 px-4 text-sm font-medium text-white transition-colors hover:border-white/60 hover:bg-white/10"
              >
                {isAuthenticated ? 'Dashboard' : 'Sign in'}
              </Link>
            </div>
          </div>
        </nav>
      )}
    </header>
  )
}
