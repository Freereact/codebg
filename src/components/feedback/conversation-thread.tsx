import { useEffect, useRef, useState } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { Button } from '../ui/button'
import { STATUS_BADGE_STYLES } from '../../lib/feedback-styles'

export interface ThreadMessage {
  id: string
  authorRole: string
  body: string
  readAt: string | null
  createdAt: string
}

interface ConversationThreadProps {
  messages: ThreadMessage[]
  loading: boolean
  currentRole: 'client' | 'admin'
  onSend: (body: string) => Promise<void>
  statusOptions?: string[]
  onStatusChange?: (status: string) => void
  currentStatus?: string
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`

  const isThisYear = d.getFullYear() === now.getFullYear()
  if (isThisYear) {
    return (
      d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
      ', ' +
      d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    )
  }
  return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' })
}

export function ConversationThread({
  messages,
  loading,
  currentRole,
  onSend,
  statusOptions,
  onStatusChange,
  currentStatus,
}: ConversationThreadProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    await onSend(text.trim())
    setText('')
    setSending(false)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSubmit(e)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-accent" />
        <p className="text-xs text-slate-400">Loading conversation...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <MessageCircle size={32} className="text-slate-300 dark:text-slate-600" />
            <p className="text-sm text-slate-400">No messages yet</p>
            <p className="text-xs text-slate-400">Start the conversation below.</p>
          </div>
        )}
        {messages.map((msg, i) => {
          const isOwn = msg.authorRole === currentRole
          const prevMsg = messages[i - 1]
          const showDateSeparator =
            !prevMsg || new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString()

          return (
            <div key={msg.id}>
              {showDateSeparator && (
                <div className="my-3 flex items-center gap-2">
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                  <span className="text-[10px] text-slate-400">
                    {new Date(msg.createdAt).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
                </div>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    isOwn
                      ? 'rounded-br-md bg-accent/10 text-slate-800 dark:text-slate-100'
                      : 'rounded-bl-md bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.body}</p>
                  <p className={`mt-1 text-[10px] ${isOwn ? 'text-right' : 'text-left'} text-slate-400`}>
                    {msg.authorRole === 'admin' ? 'CodeBG' : 'Customer'}
                    {' \u00b7 '}
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Status selector (admin only) */}
      {statusOptions && onStatusChange && currentStatus && (
        <div className="flex items-center gap-1.5 border-t border-slate-200 px-3 py-2 dark:border-slate-700">
          <span className="mr-1 text-[10px] text-slate-400">Status:</span>
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                currentStatus === s
                  ? (STATUS_BADGE_STYLES[s] ?? 'bg-accent text-black')
                  : 'bg-slate-50 text-slate-400 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-500 dark:hover:bg-slate-700'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Reply input */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 border-t border-slate-200 p-3 dark:border-slate-700"
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
          className="input max-h-24 min-h-[40px] flex-1 resize-none text-sm"
          rows={1}
          disabled={sending}
        />
        <Button type="submit" size="default" disabled={sending || !text.trim()} className="shrink-0">
          <Send size={14} />
        </Button>
      </form>
    </div>
  )
}
