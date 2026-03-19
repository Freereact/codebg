import { useEffect, useState } from 'react'
import { fetchAdminUsers } from '../../lib/admin-api'
import type { AdminUserItem } from '../../lib/admin-api'

export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    fetchAdminUsers({ search: search || undefined })
      .then((res) => {
        if (res.ok) {
          setUsers(res.data)
          setTotal(res.pagination.total)
        }
      })
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-white">Users ({total})</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by email or name..."
        className="input mb-4 max-w-sm"
      />

      {loading && <p className="animate-pulse text-slate-500">Loading...</p>}

      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="section-card flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 dark:text-white">{u.name}</p>
              <p className="text-xs text-slate-400">{u.email}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              {u.role}
            </span>
            <span className="text-xs text-slate-400">
              {u.projectCount} project{u.projectCount !== 1 ? 's' : ''}
            </span>
            <span className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
