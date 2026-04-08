import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Send, CheckCircle, Clock, MessageSquare, ChevronLeft } from 'lucide-react'
import { Button } from '../components/ui/button'
import { ConversationThread } from '../components/feedback/conversation-thread'
import type { ThreadMessage } from '../components/feedback/conversation-thread'
import { fetchProject } from '../lib/projects-api'
import { createFeedback, fetchFeedback, fetchMessages, sendMessage, markMessagesRead } from '../lib/feedback-api'
import type { FeedbackItem } from '../lib/feedback-api'
import type { ProjectDetail } from '../types/portal'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending: <Clock size={14} className="text-amber-500" />,
  in_progress: <Clock size={14} className="text-blue-500" />,
  completed: <CheckCircle size={14} className="text-green-500" />,
}

export function ProjectReviewPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [selectedSection, setSelectedSection] = useState<{ id: string; title: string } | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Thread view state
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [threadMessages, setThreadMessages] = useState<ThreadMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)

  // Load project and feedback
  useEffect(() => {
    if (!id) return
    Promise.all([fetchProject(id), fetchFeedback(id)])
      .then(([projRes, fbRes]) => {
        if (projRes.ok) setProject(projRes.data)
        if (fbRes.ok) setFeedback(fbRes.data)
      })
      .finally(() => setLoading(false))
  }, [id])

  // Open thread from URL param (e.g., from email link)
  useEffect(() => {
    const threadParam = searchParams.get('thread')
    if (threadParam && feedback.length > 0) {
      const exists = feedback.find((f) => f.id === threadParam)
      if (exists) openThread(threadParam)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedback.length, searchParams])

  // Enable review mode in iframe once loaded
  const handleIframeLoad = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: 'enable-review' }, window.location.origin)
  }, [])

  // Listen for section clicks from the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'section-click') {
        setActiveThread(null)
        setSelectedSection({ id: e.data.sectionId, title: e.data.sectionTitle })
        setComment('')
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [])

  const openThread = useCallback(
    async (feedbackId: string) => {
      if (!id) return
      setActiveThread(feedbackId)
      setSelectedSection(null)
      setThreadLoading(true)
      const res = await fetchMessages(id, feedbackId)
      if (res.ok) setThreadMessages(res.data)
      setThreadLoading(false)
      // Mark as read
      markMessagesRead(id, feedbackId).catch(() => {})
    },
    [id],
  )

  const handleSendMessage = useCallback(
    async (body: string) => {
      if (!id || !activeThread) return
      const res = await sendMessage(id, activeThread, body)
      if (res.ok) {
        setThreadMessages((prev) => [...prev, res.data])
        // Re-fetch feedback to update status (thread may have re-opened)
        const fbRes = await fetchFeedback(id)
        if (fbRes.ok) setFeedback(fbRes.data)
      }
    },
    [id, activeThread],
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !selectedSection || !comment.trim()) return
    setSubmitting(true)
    const res = await createFeedback(id, {
      sectionId: selectedSection.id,
      sectionTitle: selectedSection.title,
      description: comment.trim(),
    })
    if (res.ok) {
      setFeedback((prev) => [res.data, ...prev])
      setComment('')
      setSelectedSection(null)
    }
    setSubmitting(false)
  }

  const handleGeneralSubmit = async () => {
    if (!id || !comment.trim()) return
    setSubmitting(true)
    const res = await createFeedback(id, {
      sectionId: 'general',
      sectionTitle: 'General feedback',
      description: comment.trim(),
    })
    if (res.ok) {
      setFeedback((prev) => [res.data, ...prev])
      setComment('')
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p role="status" className="animate-pulse text-slate-500 dark:text-slate-400">
          Loading project...
        </p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500">Project not found.</p>
      </div>
    )
  }

  const previewUrl = project.subdomain ? `/sites/${project.subdomain}/` : null
  const activeItem = activeThread ? feedback.find((f) => f.id === activeThread) : null

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <Link
          to="/portal/dashboard"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-sm font-medium text-slate-800 dark:text-white">{project.subdomain ?? 'Project'}</h1>
        <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">Review Mode</span>
        <span className="ml-auto text-xs text-slate-400">
          <MessageSquare size={14} className="mr-1 inline" />
          {feedback.length} comment{feedback.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Iframe — site preview */}
        <div className="flex-1 bg-white">
          {previewUrl ? (
            <iframe
              ref={iframeRef}
              src={previewUrl}
              onLoad={handleIframeLoad}
              className="h-full w-full border-none"
              title="Site preview"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-400">
              No preview available — build your site first.
            </div>
          )}
        </div>

        {/* Comment panel */}
        <div className="flex w-80 flex-shrink-0 flex-col overflow-hidden border-l border-slate-200 bg-surface dark:border-slate-700 dark:bg-shell">
          {/* Thread view */}
          {activeThread && activeItem && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-700">
                <button
                  onClick={() => setActiveThread(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">
                    {activeItem.sectionTitle}
                  </p>
                  <p className="text-[10px] text-slate-400">{activeItem.status}</p>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ConversationThread
                  messages={threadMessages}
                  loading={threadLoading}
                  currentRole="client"
                  onSend={handleSendMessage}
                />
              </div>
            </div>
          )}

          {/* List view */}
          {!activeThread && (
            <div className="flex-1 overflow-y-auto">
              {/* Comment form (when section selected) */}
              {selectedSection && (
                <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                  <p className="mb-1 text-xs text-slate-400">
                    Section: <strong className="text-slate-600 dark:text-slate-300">{selectedSection.title}</strong>
                  </p>
                  <p className="mb-3 text-[10px] text-slate-400">{selectedSection.id}</p>
                  <form onSubmit={handleSubmit}>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What would you like to change?"
                      aria-label="Feedback for selected section"
                      rows={3}
                      className="input mb-2 resize-none text-sm"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button type="submit" size="default" disabled={submitting || !comment.trim()} className="flex-1">
                        <Send size={14} className="mr-1" />
                        {submitting ? 'Sending...' : 'Send'}
                      </Button>
                      <button
                        type="button"
                        onClick={() => setSelectedSection(null)}
                        className="rounded px-3 py-1 text-xs text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {!selectedSection && (
                <div className="border-b border-slate-200 p-4 dark:border-slate-700">
                  <p className="mb-3 text-xs text-slate-400">
                    Click a section in the preview, or leave general feedback:
                  </p>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="General feedback about the site..."
                    aria-label="General feedback about the site"
                    rows={3}
                    className="input mb-2 resize-none text-sm"
                  />
                  <Button
                    type="button"
                    size="default"
                    disabled={submitting || !comment.trim()}
                    className="w-full"
                    onClick={handleGeneralSubmit}
                  >
                    <Send size={14} className="mr-1" />
                    {submitting ? 'Sending...' : 'Send general feedback'}
                  </Button>
                </div>
              )}

              {/* Feedback list */}
              <div className="p-4">
                <h3 className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-400">Feedback</h3>
                {feedback.length === 0 && (
                  <p className="text-xs text-slate-400">No feedback yet. Click a section to start.</p>
                )}
                {feedback.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => openThread(item.id)}
                    className="mb-3 w-full rounded-lg border border-slate-200 p-3 text-left transition-colors hover:border-accent/30 hover:bg-accent/5 dark:border-slate-700 dark:hover:border-accent/30"
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      {STATUS_ICONS[item.status] ?? STATUS_ICONS.pending}
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {item.sectionTitle}
                      </span>
                      <MessageSquare size={12} className="ml-auto text-slate-400" />
                    </div>
                    <p className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                    {item.adminResponse && (
                      <p className="mt-1 text-[10px] text-green-600 dark:text-green-400">Team replied</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
