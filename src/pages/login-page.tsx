import { useState, useEffect, useCallback, useRef } from 'react'
import { Navigate } from 'react-router-dom'
import { requestMagicLink } from '../lib/auth-api'
import { loadTurnstileScript } from '../lib/turnstile'
import { useAuth } from '../hooks/use-auth'
import { useSiteMode } from '../contexts/site-mode-context'
import { Button } from '../components/ui/button'

const RESEND_COOLDOWN = 60

/** Inline Turnstile widget that re-initializes when the container mounts. */
function TurnstileWidget({
  onToken,
  onExpire,
  onError,
}: {
  onToken: (token: string) => void
  onExpire: () => void
  onError: () => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  useEffect(() => {
    let cancelled = false

    async function init() {
      if (!siteKey || !containerRef.current) return

      try {
        await loadTurnstileScript()
        if (cancelled || !window.turnstile || !containerRef.current) return

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (t: string) => onToken(t),
          'expired-callback': () => onExpire(),
        })
      } catch {
        if (!cancelled) onError()
      }
    }

    void init()
    return () => {
      cancelled = true
      if (window.turnstile && widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }
    }
    // Re-init only when this component mounts; callbacks are stable via the parent
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey])

  return <div ref={containerRef} className="flex justify-center" />
}

export function LoginPage() {
  const { state: authState } = useAuth()
  const { mode } = useSiteMode()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [turnstileToken, setTurnstileToken] = useState('')

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  const handleToken = useCallback((token: string) => setTurnstileToken(token), [])
  const handleExpire = useCallback(() => setTurnstileToken(''), [])
  const handleTurnstileError = useCallback(
    () => setError('Security widget failed to load. Please refresh the page.'),
    [],
  )

  const handleResend = useCallback(async () => {
    if (!turnstileToken) {
      setError('Please complete the security check first.')
      return
    }

    setError('')
    setLoading(true)
    setCooldown(RESEND_COOLDOWN)

    try {
      const res = await requestMagicLink(email, turnstileToken)
      setTurnstileToken('')
      if (!res.ok) {
        setError(res.error ?? 'Could not resend. Please try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [email, turnstileToken])

  if (authState.status === 'authenticated') {
    return <Navigate to="/portal/dashboard" replace />
  }

  if (mode !== 'normal') {
    return (
      <div className="mx-auto mt-12 max-w-md">
        <div className="section-card p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-slate-800 dark:text-white">Site Under Maintenance</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Signups and logins are temporarily disabled. Please check back later.
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!turnstileToken) {
      setError('Please complete the security check first.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await requestMagicLink(email, turnstileToken)
      setTurnstileToken('')
      if (res.ok) {
        setSent(true)
        setCooldown(RESEND_COOLDOWN)
      } else {
        setError(
          res.error === 'turnstile_failed'
            ? 'Security check failed. Please try again.'
            : (res.error ?? 'Something went wrong'),
        )
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
          <div className="mt-6">
            <div className="mb-4">
              <TurnstileWidget onToken={handleToken} onExpire={handleExpire} onError={handleTurnstileError} />
            </div>
            {cooldown > 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500">Resend available in {cooldown}s</p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={loading || !turnstileToken}
                className="text-sm font-medium text-accent hover:underline disabled:opacity-50"
              >
                {loading ? 'Sending...' : "Didn't receive it? Send again"}
              </button>
            )}
          </div>
          {error && (
            <p role="alert" className="mt-3 text-sm text-red-400">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={() => {
              setSent(false)
              setError('')
              setTurnstileToken('')
            }}
            className="mt-4 text-xs text-slate-400 hover:underline"
          >
            Use a different email
          </button>
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
          <TurnstileWidget onToken={handleToken} onExpire={handleExpire} onError={handleTurnstileError} />
          {error && (
            <p id="email-error" role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading || !turnstileToken}>
            {loading ? 'Sending...' : 'Send magic link'}
          </Button>
        </form>
      </div>
    </div>
  )
}
