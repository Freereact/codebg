import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/theme-context'
import { Header } from './header'
import { Footer } from './footer'

export function RootLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <ThemeProvider>
      <div className="app-shell">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:bg-accent focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to main content
        </a>

        <Header />

        <main id="main-content" className="px-4 py-10 md:px-6 md:py-12">
          <Outlet />
        </main>

        <Footer />
      </div>
    </ThemeProvider>
  )
}
