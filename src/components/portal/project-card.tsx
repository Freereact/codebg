import type { ProjectListItem } from '../../types/portal'

const STATUS_COLORS: Record<string, string> = {
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

export function ProjectCard({ project }: { project: ProjectListItem }) {
  const statusColor = STATUS_COLORS[project.status] ?? STATUS_COLORS.lead

  return (
    <div className="section-card card-hover min-h-24 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-medium text-slate-800 dark:text-white">
            {project.subdomain ? `${project.subdomain}.codebg.com` : (project.templateSlug ?? 'New project')}
          </h3>
          {project.domain && (
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{project.domain}</p>
          )}
        </div>
        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
          {project.statusLabel}
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-400 dark:text-slate-300">Started {formatDate(project.createdAt)}</p>
    </div>
  )
}
