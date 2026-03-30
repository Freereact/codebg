import { Outlet, Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, FolderKanban, Users, MessageSquare, LogOut } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'
import { cn } from '../../lib/utils'
import { SiteModeBanner } from '../ui/site-mode-banner'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/admin/projects', icon: FolderKanban, label: 'Projects', exact: false },
  { to: '/admin/feedback', icon: MessageSquare, label: 'Feedback', exact: false },
  { to: '/admin/users', icon: Users, label: 'Users', exact: false },
]

function AdminSidebar() {
  const { pathname } = useLocation()
  const { logout } = useAuth()

  return (
    <aside className="flex w-56 flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-700 dark:bg-shell">
      <div className="flex h-14 items-center border-b border-slate-200 px-4 dark:border-slate-700">
        <Link to="/admin" className="text-lg font-semibold tracking-wide">
          Code<span className="text-accent">BG</span>
          <span className="ml-2 text-xs font-normal text-slate-400">Admin</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.to : pathname.startsWith(item.to)
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent/10 font-medium text-accent'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export function AdminLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-surface dark:bg-[#14171c]">
      <SiteModeBanner variant="admin" />
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
