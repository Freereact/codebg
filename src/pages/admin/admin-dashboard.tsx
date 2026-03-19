import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, MessageSquare, Users } from 'lucide-react'
import { fetchAdminStats } from '../../lib/admin-api'
import type { AdminStats } from '../../lib/admin-api'

function StatCard({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: React.ElementType
  label: string
  value: number | string
  link: string
}) {
  return (
    <Link to={link} className="section-card card-hover flex items-center gap-4 p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-800 dark:text-white">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </Link>
  )
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null)

  useEffect(() => {
    fetchAdminStats().then((res) => {
      if (res.ok) setStats(res.data)
    })
  }, [])

  if (!stats) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <p className="animate-pulse text-slate-500">Loading stats...</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-white">Admin Dashboard</h1>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Total projects" value={stats.totalProjects} link="/admin/projects" />
        <StatCard icon={MessageSquare} label="Pending feedback" value={stats.pendingFeedback} link="/admin/feedback" />
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} link="/admin/users" />
        <StatCard
          icon={FolderKanban}
          label="Live sites"
          value={stats.projectsByStatus.preview ?? 0}
          link="/admin/projects?status=preview"
        />
      </div>

      {stats.pendingFeedback > 0 && (
        <Link
          to="/admin/feedback?status=pending"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300"
        >
          <MessageSquare size={16} />
          {stats.pendingFeedback} feedback item{stats.pendingFeedback !== 1 ? 's' : ''} need
          {stats.pendingFeedback === 1 ? 's' : ''} response
        </Link>
      )}
    </div>
  )
}
