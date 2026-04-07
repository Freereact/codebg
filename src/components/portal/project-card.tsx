import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  Trash2,
  Download,
  MessageSquare,
  Rocket,
  FileEdit,
  Clock,
  Eye,
  CheckCircle2,
  Globe,
  XCircle,
  Wrench,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { ProjectListItem } from '../../types/portal'
import { deleteProjectApi } from '../../lib/projects-api'
import { createCheckoutSession } from '../../lib/stripe-api'
import { useSiteMode } from '../../contexts/site-mode-context'
import { CustomDomainSetup } from './custom-domain-setup'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  building: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  preview: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  lead: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300',
  paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  brief_received: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  draft_ready: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  in_review: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  revisions: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  live: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  maintenance: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
}

const STATUS_ICONS: Record<string, ReactNode> = {
  draft: <FileEdit size={12} />,
  building: <Clock size={12} />,
  preview: <Eye size={12} />,
  live: <Globe size={12} />,
  maintenance: <Wrench size={12} />,
  cancelled: <XCircle size={12} />,
  paid: <CheckCircle2 size={12} />,
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

interface ProjectCardProps {
  project: ProjectListItem
  onDeleted?: () => void
}

export function ProjectCard({ project, onDeleted }: ProjectCardProps) {
  const { mode } = useSiteMode()
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const statusColor = STATUS_COLORS[project.status] ?? STATUS_COLORS.lead
  const previewUrl = project.subdomain ? `/sites/${project.subdomain}/` : null
  const canPreview = previewUrl && (project.status === 'preview' || project.status === 'live')
  const canGoLive = project.status === 'preview' && !project.planTier
  const projectName = project.subdomain ?? project.templateSlug ?? 'New project'
  const [goingLive, setGoingLive] = useState(false)

  const [goLiveError, setGoLiveError] = useState('')

  const handleGoLive = async (tier: 'starter' | 'professional') => {
    setGoingLive(true)
    setGoLiveError('')
    try {
      const res = await createCheckoutSession(project.id, tier)
      if (res.ok && res.url) {
        window.location.href = res.url
      } else {
        setGoLiveError('error' in res ? String(res.error) : 'Checkout failed')
        setGoingLive(false)
      }
    } catch {
      setGoLiveError('Network error. Please try again.')
      setGoingLive(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await deleteProjectApi(project.id)
      if (res.ok && onDeleted) {
        onDeleted()
      } else {
        setDeleteError('Failed to delete')
        setConfirmingDelete(false)
      }
    } catch {
      setDeleteError('Network error')
      setConfirmingDelete(false)
    }
    setDeleting(false)
  }

  return (
    <div className="section-card card-hover min-h-24 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-slate-800 dark:text-white">{projectName}</h3>
          {project.status === 'building' && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">Building your site...</p>
          )}
        </div>
        <span
          role="status"
          aria-label={project.statusLabel}
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}
        >
          {STATUS_ICONS[project.status]}
          {project.statusLabel}
        </span>
      </div>

      {deleteError && (
        <p role="alert" className="mt-2 text-xs text-red-500">
          {deleteError}
        </p>
      )}

      {canGoLive && (
        <div className="mt-3 rounded-lg border border-accent/30 bg-accent/5 p-3 dark:border-accent/20 dark:bg-accent/10">
          {mode !== 'normal' ? (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              Purchases are temporarily unavailable. The site is under maintenance — please check back later.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs font-medium text-slate-600 dark:text-slate-300">Make your site public:</p>
              {goLiveError && (
                <p role="alert" className="mb-2 text-xs text-red-500">
                  {goLiveError}
                </p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => handleGoLive('starter')}
                  disabled={goingLive}
                  className="flex-1 rounded-md bg-accent px-3 py-2 text-xs font-medium text-black transition-colors hover:opacity-90 disabled:opacity-50"
                >
                  <Rocket size={12} className="mr-1 inline" />
                  {goingLive ? 'Redirecting...' : 'Starter $19/mo'}
                </button>
                <button
                  onClick={() => handleGoLive('professional')}
                  disabled={goingLive}
                  className="flex-1 rounded-md border border-accent/50 px-3 py-2 text-xs font-medium text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
                >
                  Pro $39/mo
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {project.status === 'live' && project.planTier === 'professional' && (
        <CustomDomainSetup projectId={project.id} domain={project.domain} domainStatus={project.domainStatus} />
      )}

      {confirmingDelete ? (
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">Delete this project?</span>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="rounded px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            {deleting ? 'Deleting...' : 'Yes, delete'}
          </button>
          <button
            onClick={() => setConfirmingDelete(false)}
            className="rounded px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-slate-400 dark:text-slate-300">Started {formatDate(project.createdAt)}</p>
          <div className="flex items-center gap-2">
            {canPreview && (
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent transition-colors hover:bg-accent/20"
              >
                Preview <ExternalLink size={12} />
              </a>
            )}
            {canPreview && (
              <Link
                to={`/portal/projects/${project.id}/review`}
                className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
              >
                <MessageSquare size={12} /> Review
              </Link>
            )}
            {canPreview && project.planTier && (
              <a
                href={`/api/projects/${project.id}/download`}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                aria-label={`Download project ${projectName}`}
              >
                <Download size={12} />
              </a>
            )}
            <button
              onClick={() => setConfirmingDelete(true)}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              aria-label={`Delete project ${projectName}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
