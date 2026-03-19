import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { state } = useAuth()

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p role="status" className="animate-pulse text-slate-500">
          Loading...
        </p>
      </div>
    )
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (state.user.role !== 'admin') {
    return <Navigate to="/portal/dashboard" replace />
  }

  return <>{children}</>
}
