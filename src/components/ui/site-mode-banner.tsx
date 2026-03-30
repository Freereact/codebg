import { useSiteMode } from '../../contexts/site-mode-context'

export function SiteModeBanner({ variant = 'public' }: { variant?: 'public' | 'admin' }) {
  const { mode, loading } = useSiteMode()

  if (loading || mode === 'normal') return null

  const isAdmin = variant === 'admin'

  if (mode === 'maintenance') {
    return (
      <div className="bg-amber-500 px-4 py-2 text-center text-sm font-medium text-white">
        {isAdmin
          ? 'Site is in maintenance mode — signups, logins, and purchases are disabled for users.'
          : 'This site is currently under maintenance. Please check back later.'}
      </div>
    )
  }

  if (mode === 'test') {
    return (
      <div className="bg-indigo-600 px-4 py-2 text-center text-sm font-medium text-white">
        {isAdmin
          ? 'Test mode active — signups, logins, and purchases are disabled for users. Stripe test keys can be used.'
          : 'This site is currently in test mode. Please check back later.'}
      </div>
    )
  }

  return null
}
