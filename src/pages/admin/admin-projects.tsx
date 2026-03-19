import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { fetchAdminProjects } from '../../lib/admin-api'
import type { AdminProjectItem } from '../../lib/admin-api'
import { PROJECT_STATUS_LABELS } from '../../lib/admin-constants'

const STATUS_FILTERS = ['all', 'draft', 'building', 'preview', 'live', 'cancelled']

export function AdminProjectsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [projects, setProjects] = useState<AdminProjectItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  const statusFilter = searchParams.get('status') ?? 'all'

  useEffect(() => {
    setLoading(true)
    fetchAdminProjects({ status: statusFilter === 'all' ? undefined : statusFilter })
      .then((res) => {
        if (res.ok) {
          setProjects(res.data)
          setTotal(res.pagination.total)
        }
      })
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-white">Projects ({total})</h1>

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
            {s === 'all' ? 'All' : (PROJECT_STATUS_LABELS[s] ?? s)}
          </button>
        ))}
      </div>

      {loading && <p className="animate-pulse text-slate-500">Loading...</p>}

      <div className="space-y-2">
        {projects.map((p) => (
          <Link
            key={p.id}
            to={`/admin/projects/${p.id}`}
            className="section-card card-hover flex items-center gap-4 p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800 dark:text-white">
                {p.subdomain ?? p.templateSlug ?? 'Project'}
              </p>
              <p className="text-xs text-slate-400">{p.user.email}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {p.statusLabel}
            </span>
            {p.feedbackCount > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                {p.feedbackCount} feedback
              </span>
            )}
            {p.subdomain && (
              <a
                href={`/sites/${p.subdomain}/`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-slate-400 hover:text-accent"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
