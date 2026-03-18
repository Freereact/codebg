import { useEffect, useState } from 'react'

interface ToastProps {
  visible: boolean
  message: string
  variant?: 'success' | 'error'
  onDismiss: () => void
  /** Auto-dismiss delay in ms (0 = no auto-dismiss) */
  duration?: number
}

export function Toast({ visible, message, variant = 'success', onDismiss, duration = 5000 }: ToastProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      // Small delay so the enter transition plays
      const frame = requestAnimationFrame(() => setShow(true))
      return () => cancelAnimationFrame(frame)
    }
    setShow(false)
  }, [visible])

  useEffect(() => {
    if (!visible || duration === 0) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [visible, duration, onDismiss])

  if (!visible) return null

  const colors = variant === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-lg px-5 py-3 shadow-lg transition-all duration-300 ${colors} ${
        show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{message}</span>
        <button type="button" onClick={onDismiss} className="ml-1 rounded p-0.5 hover:bg-white/20" aria-label="Dismiss">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
