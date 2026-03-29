import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, RefreshCw, Send } from 'lucide-react'
import { Button } from '../../components/ui/button'
import {
  fetchAdminProject,
  updateProjectStatus,
  rebuildProject,
  respondToFeedback,
  createAdminNote,
} from '../../lib/admin-api'
import { getStatusLabel } from '../../lib/admin-constants'

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ['building', 'cancelled'],
  building: ['preview', 'draft'],
  preview: ['live', 'cancelled'],
  live: ['maintenance'],
  lead: ['paid', 'cancelled'],
  paid: ['brief_received', 'cancelled'],
}

export function AdminProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [noteText, setNoteText] = useState('')
  const [sending, setSending] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const loadProject = () => {
    if (!id) return
    setLoading(true)
    fetchAdminProject(id)
      .then((res) => {
        if (res.ok) setProject(res.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(loadProject, [id])

  if (loading || !project) {
    return <p className="animate-pulse text-slate-500">Loading...</p>
  }

  const status = project.status as string
  const subdomain = project.subdomain as string | null
  const githubUrl = project.githubUrl as string | null
  const user = project.user as { id: string; email: string; name: string }
  const feedbackItems = (project.contentRequests ?? []) as Array<{
    id: string
    title: string
    description: string
    status: string
    adminResponse: string | null
    attachments: Record<string, string>
    createdAt: string
  }>
  const notes = (project.adminNotes ?? []) as Array<{
    id: string
    content: string
    isPinned: boolean
    createdAt: string
  }>

  const handleStatusChange = async (newStatus: string) => {
    if (!id) return
    setSending('status')
    setActionError(null)
    try {
      await updateProjectStatus(id, newStatus)
      loadProject()
    } catch {
      setActionError('Failed to update status')
    } finally {
      setSending(null)
    }
  }

  const handleRebuild = async () => {
    if (!id) return
    setSending('rebuild')
    setActionError(null)
    try {
      await rebuildProject(id)
      loadProject()
    } catch {
      setActionError('Failed to trigger rebuild')
    } finally {
      setSending(null)
    }
  }

  const handleReply = async (feedbackId: string) => {
    const text = replyText[feedbackId]
    if (!text?.trim()) return
    setSending(feedbackId)
    setActionError(null)
    try {
      await respondToFeedback(feedbackId, text.trim())
      setReplyText((prev) => ({ ...prev, [feedbackId]: '' }))
      loadProject()
    } catch {
      setActionError('Failed to send reply')
    } finally {
      setSending(null)
    }
  }

  const handleAddNote = async () => {
    if (!id || !noteText.trim()) return
    setSending('note')
    setActionError(null)
    try {
      await createAdminNote({ projectId: id, content: noteText.trim() })
      setNoteText('')
      loadProject()
    } catch {
      setActionError('Failed to add note')
    }
    setSending(null)
  }

  const transitions = ALLOWED_TRANSITIONS[status] ?? []

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/admin/projects"
        className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600"
      >
        <ArrowLeft size={16} /> Back to projects
      </Link>

      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-white">{subdomain ?? 'Project'}</h1>
          <p className="text-sm text-slate-400">
            {user.email} &middot; {getStatusLabel(status)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {subdomain && (
            <a
              href={`/sites/${subdomain}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
            >
              Preview <ExternalLink size={14} />
            </a>
          )}
          <Button size="default" onClick={handleRebuild} disabled={sending === 'rebuild'}>
            <RefreshCw size={14} className="mr-1" />
            {sending === 'rebuild' ? 'Building...' : 'Rebuild'}
          </Button>
        </div>
      </div>

      {actionError && (
        <div
          role="alert"
          className="mb-4 rounded bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"
        >
          {actionError}
        </div>
      )}

      {/* GitHub */}
      {githubUrl && (
        <div className="mb-6 section-card p-4">
          <p className="mb-2 text-xs font-medium uppercase text-slate-400">GitHub Repository</p>
          <a href={githubUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline">
            {githubUrl}
          </a>
          <p className="mt-2 text-xs text-slate-400">
            Clone:{' '}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              git clone {githubUrl}.git
            </code>
          </p>
          <p className="mt-1 text-xs text-slate-400">Push changes → auto-rebuild → user notified</p>
        </div>
      )}

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="mb-6 section-card p-4">
          <p className="mb-2 text-xs font-medium uppercase text-slate-400">Change status</p>
          <div className="flex flex-wrap gap-2">
            {transitions.map((t) => (
              <Button
                key={t}
                size="default"
                variant="ghost"
                onClick={() => handleStatusChange(t)}
                disabled={sending === 'status'}
              >
                {getStatusLabel(t)}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Feedback thread — 2 columns */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
            Feedback ({feedbackItems.length})
          </h2>
          {feedbackItems.length === 0 && <p className="text-sm text-slate-400">No feedback yet.</p>}
          <div className="space-y-3">
            {feedbackItems.map((fb) => (
              <div key={fb.id} className="section-card p-4">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    {fb.attachments?.sectionTitle ?? fb.title}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      fb.status === 'completed'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : fb.status === 'pending'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {fb.status}
                  </span>
                </div>
                <p className="mb-2 text-sm text-slate-700 dark:text-slate-200">{fb.description}</p>
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
                      placeholder="Reply..."
                      className="input flex-1 text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleReply(fb.id)}
                    />
                    <Button
                      size="default"
                      onClick={() => handleReply(fb.id)}
                      disabled={sending === fb.id || !(replyText[fb.id] ?? '').trim()}
                    >
                      <Send size={14} />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notes sidebar */}
        <div>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">Internal Notes</h2>
          <div className="mb-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="input mb-2 resize-none text-sm"
            />
            <Button
              size="default"
              className="w-full"
              onClick={handleAddNote}
              disabled={sending === 'note' || !noteText.trim()}
            >
              {sending === 'note' ? 'Saving...' : 'Add note'}
            </Button>
          </div>
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                <p className="text-xs text-slate-600 dark:text-slate-300">{n.content}</p>
                <p className="mt-1 text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
            {notes.length === 0 && <p className="text-xs text-slate-400">No notes yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
