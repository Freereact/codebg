import { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import type { FormState } from '../../types'

const initialForm: FormState = { name: '', email: '', message: '' }

interface ContactModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (form: FormState) => void
  /** Whether the captcha step is showing */
  showCaptcha: boolean
  onConfirmSend: () => void
  sending: boolean
  error: string
  turnstileToken: string
  captchaStatus: 'idle' | 'loading' | 'ready' | 'failed'
}

export function ContactModal({
  open,
  onClose,
  onSubmit,
  showCaptcha,
  onConfirmSend,
  sending,
  error,
  turnstileToken,
  captchaStatus,
}: ContactModalProps) {
  const [form, setForm] = useState<FormState>(initialForm)

  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Reset form when modal opens
  useEffect(() => {
    if (open) setForm(initialForm)
  }, [open])

  if (!open) return null

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-800">
        <h3 id="contact-modal-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {showCaptcha ? 'Verify and confirm' : 'Get in touch'}
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          {showCaptcha
            ? 'Complete the security check, then confirm send.'
            : "Tell us about your project. We'll reply with a plan fast."}
        </p>

        {!showCaptcha ? (
          <form className="mt-4 grid gap-4 md:grid-cols-2" onSubmit={handleFormSubmit}>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Name</span>
              <input
                className="input"
                name="name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                required
              />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</span>
              <input
                className="input"
                type="email"
                name="email"
                value={form.email}
                onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
                required
              />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Project summary</span>
              <textarea
                className="input min-h-28"
                name="message"
                value={form.message}
                onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                required
              />
            </label>
            {error && <p className="text-sm text-red-600 md:col-span-2">{error}</p>}
            <div className="flex justify-end gap-2 md:col-span-2">
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="lg">
                Send request
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div id="turnstile-widget" className="mt-4 min-h-[72px]" />
            {captchaStatus === 'loading' && (
              <p className="mt-2 text-xs text-slate-500">Loading security check&hellip;</p>
            )}
            {captchaStatus === 'failed' && (
              <p className="mt-2 text-xs text-red-600">Security widget failed to load. Try refreshing the page.</p>
            )}
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="button" onClick={onConfirmSend} disabled={!turnstileToken || sending}>
                {sending ? 'Sending\u2026' : 'Confirm send'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
