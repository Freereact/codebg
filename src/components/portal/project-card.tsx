import { Link } from 'react-router-dom'
import { Pencil, FileEdit, Clock, Eye, Globe, XCircle, Wrench, CheckCircle2, Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'
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
}

export function ProjectCard({ project }: ProjectCardProps) {
  const statusColor = STATUS_COLORS[project.status] ?? STATUS_COLORS.lead
  const projectName = project.subdomain ?? project.templateSlug ?? 'New project'

  return (
    <Link to={`/portal/projects/${project.id}`} className="section-card card-hover block min-h-24 p-5 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-slate-800 dark:text-white">{projectName}</h3>
          {project.status === 'building' && (
            <p className="mt-1 flex items-center gap-1 text-sm text-amber-600 dark:text-amber-400">
              <Loader2 size={12} className="animate-spin" /> Building...
            </p>
          )}
          {project.domain && project.domainStatus === 'active' && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{project.domain}</p>
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

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">{formatDate(project.createdAt)}</p>
        <span
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-slate-100 hover:text-accent dark:hover:bg-slate-700"
          aria-label="Edit content"
        >
          <Pencil size={12} /> Edit
        </span>
      </div>
    </Link>
  )
}
