import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { requestMagicLink } from '../lib/auth-api'
import { useAuth } from '../contexts/auth-context'
import { Button } from '../components/ui/button'

export function LoginPage() {
  const { state: authState } = useAuth()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect to portal if already logged in
  if (authState.status === 'authenticated') {
    return <Navigate to="/portal/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await requestMagicLink(email)
      if (res.ok) {
        setSent(true)
      } else {
        setError(res.error ?? 'Something went wrong')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="mx-auto mt-12 max-w-md">
        <div className="section-card p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-slate-800 dark:text-white">Check your email</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            We sent a sign-in link to <strong className="text-slate-800 dark:text-white">{email}</strong>. Click the
            link in the email to continue.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto mt-12 max-w-md">
      <div className="section-card p-8">
        <h1 className="mb-6 text-center text-xl font-semibold text-slate-800 dark:text-white">Sign in to CodeBG</h1>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="email" className="text-sm text-slate-600 dark:text-slate-300">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
            aria-describedby={error ? 'email-error' : undefined}
          />
          {error && (
            <p id="email-error" role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send magic link'}
          </Button>
        </form>
      </div>
    </div>
  )
}
