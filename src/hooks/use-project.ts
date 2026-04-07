import { useCallback, useEffect, useState } from 'react'
import type { ProjectDetail } from '../types/portal'
import { fetchProject } from '../lib/projects-api'

interface UseProjectResult {
  project: ProjectDetail | null
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useProject(id: string): UseProjectResult {
  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetchProject(id)
      .then((res) => {
        if (res.ok) {
          setProject(res.data)
        } else {
          setError(res.error)
        }
      })
      .catch(() => {
        setError('Failed to load project')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  return { project, loading, error, refetch: load }
}
