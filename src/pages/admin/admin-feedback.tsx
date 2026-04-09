import { useEffect, useRef, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, MessageSquare, Inbox } from 'lucide-react'
import { ConversationThread } from '../../components/feedback/conversation-thread'
import type { ThreadMessage } from '../../components/feedback/conversation-thread'
import { useAdminEvents } from '../../hooks/use-admin-events'
import type { AdminNewMessageEvent } from '../../hooks/use-admin-events'
import { fetchAdminFeedback, fetchAdminMessages, sendAdminMessage, markAdminMessagesRead } from '../../lib/admin-api'
import type { AdminFeedbackItem } from '../../lib/admin-api'
import { STATUS_BADGE_STYLES } from '../../lib/feedback-styles'

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'completed']
const STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'rejected']

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  const diffHr = Math.floor(diffMs / 3_600_000)
  const diffDay = Math.floor(diffMs / 86_400_000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 30) return `${diffDay}d ago`
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function AdminFeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [feedback, setFeedback] = useState<AdminFeedbackItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Thread view state
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [threadStatus, setThreadStatus] = useState<string>('pending')
  const [newMessageThreads, setNewMessageThreads] = useState<Set<string>>(new Set())
  const activeThreadRef = useRef<string | null>(null)
  activeThreadRef.current = activeThread

  // SSE: listen for real-time customer messages
  useAdminEvents(
    useCallback((event: AdminNewMessageEvent) => {
      if (event.message.authorRole === 'admin') return // Ignore own messages echoed back
      if (activeThreadRef.current === event.feedbackId) {
        // Active thread — append message directly
        setThreadMessages((prev) => {
          if (prev.some((m) => m.id === event.message.id)) return prev
          return [...prev, event.message]
        })
        markAdminMessagesRead(event.feedbackId).catch(() => {})
      } else {
        // Different thread — show indicator
        setNewMessageThreads((prev) => new Set(prev).add(event.feedbackId))
      }
    }, []),
  )

  const statusFilter = searchParams.get('status') ?? 'all'

  const loadFeedback = useCallback(() => {
    setLoading(true)
    fetchAdminFeedback({ status: statusFilter === 'all' ? undefined : (statusFilter as 'pending') })
      .then((res) => {
        if (res.ok) {
          setFeedback(res.data)
          setTotal(res.pagination.total)
        }
      })
      .finally(() => setLoading(false))
  }, [statusFilter])

  useEffect(loadFeedback, [loadFeedback])

  const openThread = useCallback(async (feedbackId: string, status: string) => {
    setActiveThread(feedbackId)
    setThreadStatus(status)
    setThreadLoading(true)
    setNewMessageThreads((prev) => {
      const next = new Set(prev)
      next.delete(feedbackId)
      return next
    })
    const res = await fetchAdminMessages(feedbackId)
    if (res.ok) setThreadMessages(res.data)
    setThreadLoading(false)
    markAdminMessagesRead(feedbackId).catch(() => {})
  }, [])

  const handleSendMessage = useCallback(
    async (body: string) => {
      if (!activeThread) return
      const res = await sendAdminMessage(activeThread, body, threadStatus)
      if (res.ok) {
        setThreadMessages((prev) => [...prev, res.data])
        loadFeedback()
      }
    },
    [activeThread, threadStatus, loadFeedback],
  )

  const activeItem = activeThread ? feedback.find((f) => f.id === activeThread) : null

  // Thread detail view
  if (activeThread && activeItem) {
    return (
      <div className="flex h-[calc(100vh-120px)] flex-col">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => {
              setActiveThread(null)
              loadFeedback()
            }}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-slate-800 dark:text-white">{activeItem.sectionTitle}</h1>
            <p className="text-xs text-slate-400">
              <Link to={`/admin/projects/${activeItem.project.id}`} className="text-accent hover:underline">
                {activeItem.project.subdomain ?? 'Project'}
              </Link>
              <span className="mx-1.5">&middot;</span>
              {activeItem.user.email}
              <span className="mx-1.5">&middot;</span>
              {relativeTime(activeItem.createdAt)}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_BADGE_STYLES[threadStatus] ?? STATUS_BADGE_STYLES.pending}`}
          >
            {threadStatus.replace('_', ' ')}
          </span>
        </div>
        <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <ConversationThread
            messages={threadMessages}
            loading={threadLoading}
            currentRole="admin"
            onSend={handleSendMessage}
            statusOptions={STATUS_OPTIONS}
            currentStatus={threadStatus}
            onStatusChange={setThreadStatus}
          />
        </div>
      </div>
    )
  }

  // List view
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-white">
        Feedback
        <span className="ml-2 text-base font-normal text-slate-400">({total})</span>
      </h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams(s === 'all' ? {} : { status: s })}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-accent text-black'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="section-card animate-pulse p-4">
              <div className="mb-2 h-4 w-48 rounded bg-slate-200 dark:bg-slate-700" />
              <div className="mb-1 h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
              <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      )}

      {!loading && feedback.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Inbox size={40} className="text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-500">No feedback found</p>
          <p className="text-xs text-slate-400">
            {statusFilter !== 'all' ? 'Try a different filter.' : 'Customer feedback will appear here.'}
          </p>
        </div>
      )}

      <div className="space-y-3">
        {feedback.map((fb) => (
          <button
            key={fb.id}
            onClick={() => openThread(fb.id, fb.status)}
            className="section-card group w-full p-4 text-left transition-colors hover:border-accent/30"
          >
            <div className="mb-2 flex items-center gap-2">
              <Link
                to={`/admin/projects/${fb.project.id}`}
                className="truncate text-sm font-medium text-accent hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {fb.project.subdomain ?? 'Project'}
              </Link>
              <span className="text-slate-300">&middot;</span>
              <span className="truncate text-xs text-slate-500">{fb.sectionTitle}</span>
              <div className="ml-auto flex shrink-0 items-center gap-2">
                {newMessageThreads.has(fb.id) ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                    <MessageSquare size={10} className="text-white" />
                  </span>
                ) : (
                  <MessageSquare
                    size={14}
                    className="text-slate-300 transition-colors group-hover:text-accent dark:text-slate-600"
                  />
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_BADGE_STYLES[fb.status] ?? STATUS_BADGE_STYLES.pending}`}
                >
                  {fb.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <p className="mb-1.5 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">{fb.description}</p>
            <p className="text-xs text-slate-400">
              {fb.user.email}
              <span className="mx-1.5">&middot;</span>
              {relativeTime(fb.createdAt)}
              {newMessageThreads.has(fb.id) && <span className="ml-1.5 font-medium text-accent">New message</span>}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
