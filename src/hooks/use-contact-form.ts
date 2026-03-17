import { useEffect, useRef, useState } from 'react'
import type { FormState } from '../types'

declare global {
  interface Window {
    turnstile?: {
      render: (selector: string, opts: Record<string, unknown>) => string
      reset: (id: string) => void
    }
  }
}

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.turnstile) {
      resolve()
      return
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('turnstile_script_load_failed')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.defer = true
    script.dataset.turnstile = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('turnstile_script_load_failed'))
    document.head.appendChild(script)
  })
}

export function useContactForm() {
  const [showContactModal, setShowContactModal] = useState(false)
  const [showCaptchaModal, setShowCaptchaModal] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [captchaStatus, setCaptchaStatus] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle')
  const widgetIdRef = useRef<string | null>(null)
  const pendingFormRef = useRef<FormState | null>(null)

  const apiBase = import.meta.env.VITE_API_BASE_URL ?? 'https://codebg.com'
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY

  useEffect(() => {
    let cancelled = false

    async function initTurnstile() {
      if (!showCaptchaModal) return

      if (!siteKey) {
        setCaptchaStatus('failed')
        setError('Turnstile site key is missing on frontend build.')
        return
      }

      setCaptchaStatus('loading')

      try {
        await loadTurnstileScript()
        if (cancelled || !showCaptchaModal || !window.turnstile) return

        if (widgetIdRef.current) {
          window.turnstile.reset(widgetIdRef.current)
          setCaptchaStatus('ready')
          return
        }

        widgetIdRef.current = window.turnstile.render('#turnstile-widget', {
          sitekey: siteKey,
          callback: (token: string) => {
            setTurnstileToken(token)
            setCaptchaStatus('ready')
          },
          'expired-callback': () => setTurnstileToken(''),
        })

        setCaptchaStatus('ready')
      } catch {
        if (!cancelled) {
          setCaptchaStatus('failed')
          setError('Security widget failed to load. Please refresh and try again.')
        }
      }
    }

    void initTurnstile()
    return () => {
      cancelled = true
    }
  }, [showCaptchaModal, siteKey])

  const scrollToContact = () => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const openContactModal = () => {
    setSent(false)
    setError('')
    setShowContactModal(true)
  }

  const closeContactModal = () => {
    setShowContactModal(false)
    setShowCaptchaModal(false)
    setTurnstileToken('')
    setError('')
  }

  const handleContactSubmit = (form: FormState) => {
    setError('')
    setSent(false)

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in all fields before verification.')
      return
    }
    if (form.message.trim().length < 3) {
      setError('Project summary must be at least 3 characters.')
      return
    }

    pendingFormRef.current = form
    setTurnstileToken('')
    setShowCaptchaModal(true)
  }

  const submitVerified = async () => {
    if (!turnstileToken) {
      setError('Complete the verification challenge first.')
      return
    }

    const form = pendingFormRef.current
    if (!form) return

    setSending(true)
    setError('')

    try {
      const res = await fetch(`${apiBase}/api/email-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          message: form.message,
          turnstileToken,
        }),
      })

      const data = (await res.json()) as { ok: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Failed to submit request.')
        return
      }

      setSent(true)
      pendingFormRef.current = null
      setTurnstileToken('')
      setShowCaptchaModal(false)
      setShowContactModal(false)
      if (window.turnstile && widgetIdRef.current) window.turnstile.reset(widgetIdRef.current)
    } catch {
      setError('Network error while sending request.')
    } finally {
      setSending(false)
    }
  }

  const closeCaptchaModal = () => {
    setShowCaptchaModal(false)
    setTurnstileToken('')
  }

  return {
    scrollToContact,
    handleContactSubmit,
    submitVerified,
    closeCaptchaModal,
    showCaptchaModal,
    showContactModal,
    openContactModal,
    closeContactModal,
    sending,
    sent,
    error,
    turnstileToken,
    captchaStatus,
  }
}
