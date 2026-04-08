import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '../ui/button'

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
  const isToday = d.toDateString() === now.toDateString()
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  return (
    d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  )
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="animate-pulse text-xs text-slate-400">Loading conversation...</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="py-4 text-center text-xs text-slate-400">No messages yet. Start the conversation.</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.authorRole === currentRole
          return (
            <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  isOwn
                    ? 'bg-accent/10 text-slate-800 dark:text-slate-100'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                }`}
              >
                <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">
                  {msg.authorRole === 'admin' ? 'CodeBG Team' : 'You'}
                  {currentRole === 'admin' && msg.authorRole === 'client' && ' (Customer)'}
                  {currentRole === 'client' && msg.authorRole === 'admin' && ''}
                </p>
                <p className="whitespace-pre-wrap">{msg.body}</p>
                <p className="mt-1 text-[10px] text-slate-400">{formatTime(msg.createdAt)}</p>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Status selector (admin only) */}
      {statusOptions && onStatusChange && currentStatus && (
        <div className="flex items-center gap-2 border-t border-slate-200 px-3 py-2 dark:border-slate-700">
          <span className="text-[10px] text-slate-400">Status:</span>
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                currentStatus === s
                  ? 'bg-accent text-black'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400'
              }`}
            >
              {s.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      {/* Reply input */}
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-slate-200 p-3 dark:border-slate-700">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="input flex-1 text-sm"
          disabled={sending}
        />
        <Button type="submit" size="default" disabled={sending || !text.trim()}>
          <Send size={14} />
        </Button>
      </form>
    </div>
  )
}
