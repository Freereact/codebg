import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Send } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { fetchAdminFeedback, respondToFeedback } from '../../lib/admin-api'
import type { AdminFeedbackItem } from '../../lib/admin-api'

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'completed']

export function AdminFeedbackPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [feedback, setFeedback] = useState<AdminFeedbackItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [sending, setSending] = useState<string | null>(null)

  const statusFilter = searchParams.get('status') ?? 'all'

  const loadFeedback = () => {
    setLoading(true)
    fetchAdminFeedback({ status: statusFilter === 'all' ? undefined : (statusFilter as 'pending') })
      .then((res) => {
        if (res.ok) {
          setFeedback(res.data)
          setTotal(res.pagination.total)
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(loadFeedback, [statusFilter])

  const handleReply = async (feedbackId: string) => {
    const text = replyText[feedbackId]
    if (!text?.trim()) return
    setSending(feedbackId)
    await respondToFeedback(feedbackId, text.trim())
    setReplyText((prev) => ({ ...prev, [feedbackId]: '' }))
    loadFeedback()
    setSending(null)
  }

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
          <div key={fb.id} className="section-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <Link
                  to={`/admin/projects/${fb.project.id}`}
                  className="text-sm font-medium text-accent hover:underline"
                >
                  {fb.project.subdomain ?? 'Project'}
                </Link>
                <span className="mx-2 text-slate-300">&middot;</span>
                <span className="text-xs text-slate-500">{fb.sectionTitle}</span>
              </div>
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
            <p className="mb-1 text-sm text-slate-700 dark:text-slate-200">{fb.description}</p>
            <p className="mb-2 text-xs text-slate-400">
              from {fb.user.email} &middot; {new Date(fb.createdAt).toLocaleDateString()}
            </p>
            {fb.adminResponse && (
              <div className="mb-2 rounded bg-green-50 p-2 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-300">
                <strong>Your reply:</strong> {fb.adminResponse}
              </div>
            )}
            {fb.status !== 'completed' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText[fb.id] ?? ''}
                  onChange={(e) => setReplyText((prev) => ({ ...prev, [fb.id]: e.target.value }))}
                  placeholder="Reply and mark as done..."
                  className="input flex-1 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && handleReply(fb.id)}
                />
                <Button size="default" onClick={() => handleReply(fb.id)} disabled={sending === fb.id}>
                  <Send size={14} />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
