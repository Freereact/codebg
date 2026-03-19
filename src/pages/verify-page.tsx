import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { verifyToken } from '../lib/auth-api'
import { useAuth } from '../contexts/auth-context'

export function VerifyPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [error, setError] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) {
      setError('Missing token')
      return
    }

    verifyToken(token)
      .then((res) => {
        if (res.ok && res.user) {
          setUser(res.user)
          navigate('/portal/dashboard', { replace: true })
        } else {
          setError(res.error ?? 'Invalid or expired link')
        }
      })
      .catch(() => {
        setError('Network error. Please try again.')
      })
  }, [searchParams, navigate, setUser])

  if (error) {
    return (
      <div className="mx-auto mt-12 max-w-md">
        <div className="section-card p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-slate-800 dark:text-white">Verification failed</h1>
          <p role="alert" className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            {error}
          </p>
          <Link to="/login" className="text-accent hover:underline">
            Try signing in again
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-[30vh] items-center justify-center">
      <p role="status" className="animate-pulse text-slate-400">
        Verifying...
      </p>
    </div>
  )
}
