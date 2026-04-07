import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Eye, MessageSquare, Download, Rocket } from 'lucide-react'
import { useProject } from '../hooks/use-project'
import { useProjectEvents } from '../hooks/use-project-events'
import { createCheckoutSession } from '../lib/stripe-api'
import { Button } from '../components/ui/button'
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
  const events = useProjectEvents(project?.status === 'building' ? id : undefined)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

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

      {activeTab === 'content' && (
        <div className="section-card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Content editing — coming in the next update.</p>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="section-card p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Settings — coming in the next update.</p>
        </div>
      )}
    </div>
  )
}
