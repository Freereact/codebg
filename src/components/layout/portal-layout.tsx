import { useEffect, useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Sun, Moon, LogOut, Settings, Bell } from 'lucide-react'
import { useThemeContext } from '../../hooks/use-theme'
import { useAuth } from '../../hooks/use-auth'
import { useProjects } from '../../hooks/use-projects'
import { fetchUnreadCounts } from '../../lib/feedback-api'
import { SiteModeBanner } from '../ui/site-mode-banner'
import { IS_TEST } from '../../lib/config'

function PortalHeader() {
  const { theme, toggleTheme } = useThemeContext()
  const { state: authState, logout } = useAuth()
  const { projects } = useProjects()
  const [totalUnread, setTotalUnread] = useState(0)

  useEffect(() => {
    if (projects.length === 0) {
      setTotalUnread(0)
      return
    }
    Promise.all(projects.map((p) => fetchUnreadCounts(p.id))).then((results) => {
      const sum = results.reduce((acc, res) => (res.ok ? acc + res.data.total : acc), 0)
      setTotalUnread(sum)
    })
  }, [projects])

  const email = authState.status === 'authenticated' ? authState.user.email : ''

  return (
    <header className="sticky top-0 z-40 border-b border-slate-700 bg-shell text-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
        <Link to="/" className="text-lg font-semibold tracking-wide">
          Code<span className="text-accent">BG</span>
          {IS_TEST && (
            <span className="ml-2 rounded bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">
              test
            </span>
          )}
        </Link>

        <div className="flex items-center gap-4">
          <span className="hidden text-sm text-slate-300 sm:inline">{email}</span>

          <Link
            to="/portal/dashboard"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
            aria-label={totalUnread > 0 ? `${totalUnread} unread messages` : 'Messages'}
          >
            <Bell size={18} />
            {totalUnread > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {totalUnread > 99 ? '99+' : totalUnread}
              </span>
            )}
          </Link>

          <Link
            to="/portal/settings"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
            aria-label="Account settings"
          >
            <Settings size={18} />
          </Link>

          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10"
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button
            onClick={logout}
            className="flex h-9 items-center gap-2 rounded-lg px-3 text-sm text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  )
}

export function PortalLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface dark:bg-shell">
      <SiteModeBanner />
      <PortalHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 md:px-6">
        <Outlet />
      </main>
    </div>
  )
}
