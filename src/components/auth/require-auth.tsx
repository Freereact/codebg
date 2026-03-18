import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/auth-context'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { state } = useAuth()

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p role="status" className="text-muted animate-pulse">
          Loading...
        </p>
      </div>
    )
  }

  if (state.status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
