import { Outlet, Link } from 'react-router-dom'
import { ThemeProvider } from '../../contexts/theme-context'

export function AuthLayout() {
  return (
    <ThemeProvider>
      <div className="flex min-h-screen flex-col items-center justify-center bg-shell px-4">
        <Link to="/" className="mb-8 text-2xl font-semibold tracking-wide text-white">
          Code<span className="text-accent">BG</span>
        </Link>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </ThemeProvider>
  )
}
