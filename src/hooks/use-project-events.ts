import { useEffect, useRef, useState } from 'react'
import type { ProjectStatus } from '../types/portal'

interface NewMessageEvent {
  feedbackId: string
  message: {
    id: string
    contentRequestId: string
    authorId: string
    authorRole: string
    body: string
    readAt: string | null
    createdAt: string
  }
}

interface ProjectEventState {
  status: ProjectStatus | null
  step: string | null
  error: string | null
  connected: boolean
  buildComplete: boolean
  durationMs: number | null
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function useProjectEvents(
  projectId: string | undefined,
  onNewMessage?: (event: NewMessageEvent) => void,
): ProjectEventState {
  const [state, setState] = useState<ProjectEventState>({
    status: null,
    step: null,
    error: null,
    connected: false,
    buildComplete: false,
    durationMs: null,
  })

  // Use ref for the callback so SSE listener always calls the latest version
  const onNewMessageRef = useRef(onNewMessage)
  onNewMessageRef.current = onNewMessage

  useEffect(() => {
    if (!projectId) return

    const source = new EventSource(`${API_BASE}/api/projects/${projectId}/events`, {
      withCredentials: true,
    } as EventSourceInit)

    // Auto-close after 10 minutes to prevent ghost connections
    const maxLifetime = setTimeout(
      () => {
        source.close()
        setState((s) => ({ ...s, connected: false }))
      },
      10 * 60 * 1000,
    )

    source.onopen = () => {
      setState((s) => ({ ...s, connected: true }))
    }

    source.addEventListener('status', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { status: ProjectStatus }
      setState((s) => ({ ...s, status: data.status, step: null, error: null }))
    })

    source.addEventListener('progress', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { step: string }
      setState((s) => ({ ...s, step: data.step }))
    })

    source.addEventListener('build-complete', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { durationMs: number }
      setState((s) => ({ ...s, buildComplete: true, step: null, durationMs: data.durationMs }))
      source.close()
    })

    source.addEventListener('new-message', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as NewMessageEvent
      onNewMessageRef.current?.(data)
    })

    source.addEventListener('error', (e) => {
      if ((e as MessageEvent).data) {
        const data = JSON.parse((e as MessageEvent).data) as { message: string }
        setState((s) => ({ ...s, error: data.message, step: null }))
        source.close()
      }
    })

    source.onerror = () => {
      setState((s) => ({ ...s, connected: false }))
    }

    return () => {
      source.close()
      clearTimeout(maxLifetime)
    }
  }, [projectId])

  return state
}
