import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronLeft, MessageSquare } from 'lucide-react'
import { ConversationThread } from '../../components/feedback/conversation-thread'
import type { ThreadMessage } from '../../components/feedback/conversation-thread'
import { fetchAdminFeedback, fetchAdminMessages, sendAdminMessage, markAdminMessagesRead } from '../../lib/admin-api'
import type { AdminFeedbackItem } from '../../lib/admin-api'

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'completed']
const STATUS_OPTIONS = ['pending', 'in_progress', 'completed', 'rejected']

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
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-slate-800 dark:text-white">{activeItem.sectionTitle}</h1>
            <p className="text-xs text-slate-400">
              <Link to={`/admin/projects/${activeItem.project.id}`} className="text-accent hover:underline">
                {activeItem.project.subdomain ?? 'Project'}
              </Link>
              <span className="mx-1">&middot;</span>
              {activeItem.user.email}
              <span className="mx-1">&middot;</span>
              {new Date(activeItem.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
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
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-white">Feedback ({total})</h1>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setSearchParams(s === 'all' ? {} : { status: s })}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-accent text-black'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {s === 'all' ? 'All' : s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading && <p className="animate-pulse text-slate-500">Loading...</p>}

      <div className="space-y-3">
        {feedback.map((fb) => (
          <button
            key={fb.id}
            onClick={() => openThread(fb.id, fb.status)}
            className="section-card w-full p-4 text-left transition-colors hover:border-accent/30"
          >
            <div className="mb-2 flex items-center justify-between">
              <div>
                <Link
                  to={`/admin/projects/${fb.project.id}`}
                  className="text-sm font-medium text-accent hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {fb.project.subdomain ?? 'Project'}
                </Link>
                <span className="mx-2 text-slate-300">&middot;</span>
                <span className="text-xs text-slate-500">{fb.sectionTitle}</span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare size={14} className="text-slate-400" />
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    fb.status === 'pending'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                      : fb.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                  }`}
                >
                  {fb.status}
                </span>
              </div>
            </div>
            <p className="mb-1 line-clamp-2 text-sm text-slate-700 dark:text-slate-200">{fb.description}</p>
            <p className="text-xs text-slate-400">
              from {fb.user.email} &middot; {new Date(fb.createdAt).toLocaleDateString()}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
