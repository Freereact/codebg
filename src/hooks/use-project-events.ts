import { useEffect, useState, useCallback } from 'react'

interface ProjectEventState {
  status: string | null
  step: string | null
  error: string | null
  connected: boolean
  buildComplete: boolean
  durationMs: number | null
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function useProjectEvents(projectId: string | undefined): ProjectEventState {
  const [state, setState] = useState<ProjectEventState>({
    status: null,
    step: null,
    error: null,
    connected: false,
    buildComplete: false,
    durationMs: null,
  })

  useEffect(() => {
    if (!projectId) return

    const source = new EventSource(`${API_BASE}/api/projects/${projectId}/events`, {
      withCredentials: true,
    } as EventSourceInit)

    source.onopen = () => {
      setState((s) => ({ ...s, connected: true }))
    }

    source.addEventListener('status', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      setState((s) => ({ ...s, status: data.status, step: null, error: null }))
    })

    source.addEventListener('progress', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      setState((s) => ({ ...s, step: data.step }))
    })

    source.addEventListener('build-complete', (e) => {
      const data = JSON.parse((e as MessageEvent).data)
      setState((s) => ({ ...s, buildComplete: true, step: null, durationMs: data.durationMs }))
    })

    source.addEventListener('error', (e) => {
      if ((e as MessageEvent).data) {
        const data = JSON.parse((e as MessageEvent).data)
        setState((s) => ({ ...s, error: data.message, step: null }))
      }
    })

    source.onerror = () => {
      setState((s) => ({ ...s, connected: false }))
    }

    return () => {
      source.close()
    }
  }, [projectId])

  const reset = useCallback(() => {
    setState((s) => ({ ...s, buildComplete: false, durationMs: null, error: null }))
  }, [])

  return { ...state, reset } as ProjectEventState
}
