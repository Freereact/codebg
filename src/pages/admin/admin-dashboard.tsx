import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, MessageSquare, Users, Shield } from 'lucide-react'
import { fetchAdminStats, fetchSiteMode, updateSiteMode } from '../../lib/admin-api'
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

const MODE_OPTIONS = [
  { value: 'normal', label: 'Normal', color: 'bg-emerald-500', description: 'Site fully operational' },
  {
    value: 'maintenance',
    label: 'Maintenance',
    color: 'bg-amber-500',
    description: 'Block signups, logins & purchases',
  },
  { value: 'test', label: 'Test', color: 'bg-indigo-600', description: 'Block users, enable Stripe testing' },
] as const

function SiteModePanel() {
  const [mode, setMode] = useState<string>('normal')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState<string | null>(null)

  useEffect(() => {
    fetchSiteMode().then((res) => {
      if (res.ok) setMode(res.data.mode)
      setLoading(false)
    })
  }, [])

  async function handleModeChange(newMode: string) {
    if (newMode === mode) return
    if (newMode !== 'normal' && confirm !== newMode) {
      setConfirm(newMode)
      return
    }
    setConfirm(null)
    setSaving(true)
    const res = await updateSiteMode(newMode)
    if (res.ok) setMode(res.data.mode)
    setSaving(false)
  }

  if (loading) return null

  return (
    <div className="section-card mb-8 p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Shield size={20} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Site Mode</h2>
          <p className="text-xs text-slate-500">Control access to signups, logins, and purchases</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {MODE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handleModeChange(opt.value)}
            disabled={saving}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
              mode === opt.value
                ? 'border-transparent bg-slate-800 text-white dark:bg-white dark:text-slate-900'
                : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <span className={`inline-block h-2.5 w-2.5 rounded-full ${opt.color}`} />
            {opt.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-xs text-slate-500">{MODE_OPTIONS.find((o) => o.value === mode)?.description}</p>

      {confirm && (
        <div className="mt-3 flex items-center gap-3 rounded-lg bg-amber-50 px-4 py-3 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Enable <strong>{confirm}</strong> mode? Users won&apos;t be able to sign in or purchase.
          </p>
          <button
            onClick={() => handleModeChange(confirm)}
            className="rounded bg-amber-600 px-3 py-1 text-xs font-medium text-white hover:bg-amber-700"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
          <button
            onClick={() => setConfirm(null)}
            className="text-xs text-amber-700 underline dark:text-amber-400"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
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

      <SiteModePanel />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={FolderKanban} label="Total projects" value={stats.totalProjects} link="/admin/projects" />
        <StatCard icon={MessageSquare} label="Pending feedback" value={stats.pendingFeedback} link="/admin/feedback" />
        <StatCard icon={Users} label="Total users" value={stats.totalUsers} link="/admin/users" />
        <StatCard
          icon={FolderKanban}
          label="Live sites"
          value={(stats.projectsByStatus.live ?? 0) + (stats.projectsByStatus.maintenance ?? 0)}
          link="/admin/projects?status=live"
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
