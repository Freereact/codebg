import { useEffect, useState } from 'react'
import type { ProjectListItem } from '../types/portal'
import { fetchProjects } from '../lib/projects-api'

interface UseProjectsResult {
  projects: ProjectListItem[]
  total: number
  loading: boolean
  error: string | null
}

export function useProjects(): UseProjectsResult {
  const [projects, setProjects] = useState<ProjectListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProjects()
      .then((res) => {
        if (res.ok) {
          setProjects([...res.data])
          setTotal(res.pagination.total)
        } else {
          setError('error' in res ? String(res.error) : 'Unknown error')
        }
      })
      .catch(() => {
        setError('Failed to load projects')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  return { projects, total, loading, error }
}
