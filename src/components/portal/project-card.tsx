import { ExternalLink } from 'lucide-react'
import type { ProjectListItem } from '../../types/portal'

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

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function ProjectCard({ project }: { project: ProjectListItem }) {
  const statusColor = STATUS_COLORS[project.status] ?? STATUS_COLORS.lead
  const previewUrl = `${API_BASE}/api/projects/${project.id}/preview/`
  const canPreview = project.status === 'preview' || project.status === 'live'
  const projectName = project.subdomain ?? project.templateSlug ?? 'New project'

  return (
    <div className="section-card card-hover min-h-24 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-slate-800 dark:text-white">{projectName}</h3>
          {project.status === 'building' && (
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">Building your site...</p>
          )}
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
          {project.statusLabel}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-300">Started {formatDate(project.createdAt)}</p>
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
      </div>
    </div>
  )
}
