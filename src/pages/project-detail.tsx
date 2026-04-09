import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Eye, MessageSquare, Download, Rocket } from 'lucide-react'
import type { ProjectDetail } from '../types/portal'
import { useProject } from '../hooks/use-project'
import { useProjectEvents } from '../hooks/use-project-events'
import { createCheckoutSession } from '../lib/stripe-api'
import { updateProject } from '../lib/projects-api'
import { fetchUnreadCounts } from '../lib/feedback-api'
import { BusinessInfoEditForm } from '../components/portal/business-info-edit-form'
import { BuildProgress } from '../components/portal/build-progress'
import { CustomDomainSetup } from '../components/portal/custom-domain-setup'
import { deleteProjectApi } from '../lib/projects-api'
import { Button } from '../components/ui/button'
import { UnreadBadge } from '../components/ui/unread-badge'
import { SkeletonCard } from '../components/ui/skeleton'
import { cn } from '../lib/utils'
import { useState, useEffect } from 'react'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  building: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  preview: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  live: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

type TabId = 'overview' | 'content' | 'settings'
const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'content', label: 'Content' },
  { id: 'settings', label: 'Settings' },
]

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabId) ?? 'overview'
  const [activeTab, setActiveTab] = useState<TabId>(TABS.some((t) => t.id === initialTab) ? initialTab : 'overview')
  const { project, loading, error, refetch } = useProject(id ?? '')
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  // SSE: build events + real-time message notifications
  const events = useProjectEvents(id, () => {
    setUnreadCount((c) => c + 1)
  })

  // Fetch unread feedback message count on mount
  useEffect(() => {
    if (!id) return
    fetchUnreadCounts(id).then((res) => {
      if (res.ok) setUnreadCount(res.data.total)
    })
  }, [id])

  // Auto-refresh when building
  useEffect(() => {
    if (project?.status !== 'building') return
    const timer = setInterval(refetch, 2000)
    return () => clearInterval(timer)
  }, [project?.status, refetch])

  // Refresh when build completes via SSE
  useEffect(() => {
    if (events.buildComplete) refetch()
  }, [events.buildComplete, refetch])

  const handleCheckout = async (tier: 'starter' | 'professional') => {
    if (!project) return
    setCheckoutLoading(true)
    setCheckoutError('')
    try {
      const res = await createCheckoutSession(project.id, tier)
      if (!res.ok) {
        setCheckoutError(res.error)
        setCheckoutLoading(false)
      } else if ('upgraded' in res && res.upgraded) {
        window.location.reload()
      } else if ('url' in res) {
        window.location.href = res.url
      }
    } catch {
      setCheckoutError('Network error. Please try again.')
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <SkeletonCard />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="section-card p-8 text-center">
          <p className="text-sm text-red-500">{error ?? 'Project not found'}</p>
          <Link to="/portal/dashboard" className="mt-4 inline-block text-sm text-accent hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  const projectName = project.subdomain ?? project.templateSlug ?? 'Project'
  const previewUrl = project.subdomain ? `/sites/${project.subdomain}/` : null
  const canGoLive = project.status === 'preview' && !project.planTier
  const canUpgrade = project.status === 'live' && project.planTier === 'starter'

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          to="/portal/dashboard"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-white">{projectName}</h1>
        </div>
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            STATUS_COLORS[project.status] ?? STATUS_COLORS.draft,
          )}
        >
          {project.statusLabel}
        </span>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex border-b border-slate-200 dark:border-slate-700">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-b-2 border-accent text-accent'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* URLs */}
          <div className="section-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Site URLs</h2>
            <div className="space-y-2 text-sm">
              {previewUrl && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Preview</span>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    {project.subdomain}.codebg.com <ExternalLink size={12} />
                  </a>
                </div>
              )}
              {project.domain && project.domainStatus === 'active' && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Custom domain</span>
                  <a
                    href={`https://${project.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    {project.domain} <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="section-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Actions</h2>
            <div className="flex flex-wrap gap-2">
              {previewUrl && (project.status === 'preview' || project.status === 'live') && (
                <Button asChild variant="ghost">
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                    <Eye size={14} className="mr-1.5" /> Preview
                  </a>
                </Button>
              )}
              <Button asChild variant="ghost">
                <Link to={`/portal/projects/${project.id}/review`}>
                  <MessageSquare size={14} className="mr-1.5" /> Review
                  <UnreadBadge count={unreadCount} />
                </Link>
              </Button>
              {project.planTier && (
                <Button asChild variant="ghost">
                  <a href={`/api/projects/${project.id}/download`}>
                    <Download size={14} className="mr-1.5" /> Download
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* Go Live / Upgrade */}
          {canGoLive && (
            <div className="section-card border-accent/30 bg-accent/5 p-5 dark:border-accent/20 dark:bg-accent/10">
              <p className="mb-3 text-sm font-medium text-slate-700 dark:text-slate-200">Make your site public:</p>
              {checkoutError && <p className="mb-2 text-xs text-red-500">{checkoutError}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCheckout('starter')}
                  disabled={checkoutLoading}
                  className="flex-1 rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-black transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  <Rocket size={14} className="mr-1.5 inline" />
                  {checkoutLoading ? 'Redirecting...' : 'Starter $19/mo'}
                </button>
                <button
                  onClick={() => handleCheckout('professional')}
                  disabled={checkoutLoading}
                  className="flex-1 rounded-md border border-accent/50 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
                >
                  Pro $39/mo
                </button>
              </div>
            </div>
          )}

          {canUpgrade && (
            <div className="section-card p-5">
              <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                Upgrade to Professional for custom domain + priority support:
              </p>
              {checkoutError && <p className="mb-2 text-xs text-red-500">{checkoutError}</p>}
              <button
                onClick={() => handleCheckout('professional')}
                disabled={checkoutLoading}
                className="rounded-md border border-accent/50 px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
              >
                {checkoutLoading ? 'Upgrading...' : 'Upgrade to Pro $39/mo'}
              </button>
            </div>
          )}

          {/* Info */}
          <div className="section-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-800 dark:text-white">Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Template</span>
                <span className="text-slate-800 dark:text-white">{project.templateSlug ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Plan</span>
                <span className="text-slate-800 dark:text-white">{project.planTier ?? 'Free'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Created</span>
                <span className="text-slate-800 dark:text-white">
                  {new Date(project.createdAt).toLocaleDateString('en-CA', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && project.siteConfig && (
        <div className="space-y-4">
          <div className="section-card p-5">
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Edit your business info below. Changes trigger an automatic rebuild (takes a few seconds).
            </p>
            <BusinessInfoEditForm
              initialValues={
                ((project.siteConfig as Record<string, unknown>).businessInfo as Record<string, string>) ?? {}
              }
              onSave={async (changed) => {
                setSaving(true)
                setSaveMessage('')
                const res = await updateProject(project.id, { businessInfo: changed as Record<string, string> })
                setSaving(false)
                if (res.ok) {
                  setSaveMessage('Saved. Your site is rebuilding...')
                  refetch()
                  setTimeout(() => setSaveMessage(''), 5000)
                } else {
                  setSaveMessage(`Error: ${res.error}`)
                }
              }}
              saving={saving}
            />
            {saveMessage && (
              <p
                className={`mt-3 text-sm ${saveMessage.startsWith('Error') ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}
              >
                {saveMessage}
              </p>
            )}
          </div>

          {project.status === 'building' && (
            <div className="section-card p-5">
              <BuildProgress
                status={events.status}
                step={events.step}
                buildComplete={events.buildComplete}
                durationMs={events.durationMs}
                error={events.error}
              />
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && <SettingsTab project={project} onUpdate={refetch} />}
    </div>
  )
}

function SettingsTab({ project, onUpdate }: { project: ProjectDetail; onUpdate: () => void }) {
  const siteConfig = (project.siteConfig as Record<string, unknown>) ?? {}
  const comingSoon = siteConfig.comingSoon === true
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleToggleComingSoon = async () => {
    setToggling(true)
    await updateProject(project.id, { comingSoon: !comingSoon })
    setToggling(false)
    onUpdate()
  }

  const handleDelete = async () => {
    setDeleting(true)
    const res = await deleteProjectApi(project.id)
    if (res.ok) {
      window.location.href = '/portal/dashboard'
    }
    setDeleting(false)
  }

  return (
    <div className="space-y-4">
      {/* Coming Soon toggle */}
      {project.status === 'live' && (
        <div className="section-card p-5">
          <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-white">Coming Soon page</h2>
          <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
            Show a &ldquo;Coming Soon&rdquo; placeholder instead of your site. You (the owner) always see the real site.
          </p>
          <button
            onClick={handleToggleComingSoon}
            disabled={toggling}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              comingSoon ? 'bg-accent' : 'bg-slate-300 dark:bg-slate-600',
            )}
            role="switch"
            aria-checked={comingSoon}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white transition-transform',
                comingSoon ? 'translate-x-6' : 'translate-x-1',
              )}
            />
          </button>
          <span className="ml-3 text-sm text-slate-600 dark:text-slate-300">
            {comingSoon ? 'Active — visitors see Coming Soon' : 'Off — visitors see your site'}
          </span>
        </div>
      )}

      {/* Custom domain */}
      {project.status === 'live' && project.planTier === 'professional' && (
        <div className="section-card p-5">
          <h2 className="mb-1 text-sm font-semibold text-slate-800 dark:text-white">Custom domain</h2>
          <CustomDomainSetup projectId={project.id} domain={project.domain} domainStatus={project.domainStatus} />
        </div>
      )}

      {/* Danger zone */}
      <div className="section-card border-red-200 p-5 dark:border-red-800/50">
        <h2 className="mb-1 text-sm font-semibold text-red-600 dark:text-red-400">Danger zone</h2>
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Permanently delete this project and all associated data. This cannot be undone.
        </p>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Are you sure?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              {deleting ? 'Deleting...' : 'Yes, delete permanently'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="rounded px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="rounded border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Delete project
          </button>
        )}
      </div>
    </div>
  )
}
