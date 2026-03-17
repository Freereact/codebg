import { useEffect } from 'react'
import { Button } from '../ui/button'

interface CaptchaModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  sending: boolean
  turnstileToken: string
  captchaStatus: 'idle' | 'loading' | 'ready' | 'failed'
}

export function CaptchaModal({
  open,
  onClose,
  onConfirm,
  sending,
  turnstileToken,
  captchaStatus,
}: CaptchaModalProps) {
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="captcha-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl">
        <h3 id="captcha-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">Verify and confirm</h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Complete the security check, then confirm send.</p>
        <div id="turnstile-widget" className="mt-4 min-h-[72px]" />
        {captchaStatus === 'loading' && <p className="mt-2 text-xs text-slate-500">Loading security check&hellip;</p>}
        {captchaStatus === 'failed' && <p className="mt-2 text-xs text-red-600">Security widget failed to load. Try refreshing the page.</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="button" onClick={onConfirm} disabled={!turnstileToken || sending}>
            {sending ? 'Sending\u2026' : 'Confirm send'}
          </Button>
        </div>
      </div>
    </div>
  )
}
