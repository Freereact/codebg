import { useEffect, useRef } from 'react'

export interface AdminNewMessageEvent {
  feedbackId: string
  projectId?: string
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

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function useAdminEvents(onNewMessage?: (event: AdminNewMessageEvent) => void): { connected: boolean } {
  const onNewMessageRef = useRef(onNewMessage)
  onNewMessageRef.current = onNewMessage

  const connectedRef = useRef(false)

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/admin/events`, {
      withCredentials: true,
    } as EventSourceInit)

    const maxLifetime = setTimeout(
      () => {
        source.close()
        connectedRef.current = false
      },
      10 * 60 * 1000,
    )

    source.onopen = () => {
      connectedRef.current = true
    }

    source.addEventListener('new-message', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as AdminNewMessageEvent
      onNewMessageRef.current?.(data)
    })

    source.onerror = () => {
      connectedRef.current = false
    }

    return () => {
      source.close()
      clearTimeout(maxLifetime)
    }
  }, [])

  return { connected: connectedRef.current }
}
