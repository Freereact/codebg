import { useEffect, useRef, useState } from 'react'

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
  const [connected, setConnected] = useState(false)
  const onNewMessageRef = useRef(onNewMessage)
  onNewMessageRef.current = onNewMessage

  useEffect(() => {
    const source = new EventSource(`${API_BASE}/api/admin/events`, {
      withCredentials: true,
    } as EventSourceInit)

    const maxLifetime = setTimeout(
      () => {
        source.close()
        setConnected(false)
      },
      10 * 60 * 1000,
    )

    source.onopen = () => {
      setConnected(true)
    }

    source.addEventListener('new-message', (e) => {
      const data = JSON.parse((e as MessageEvent).data) as AdminNewMessageEvent
      onNewMessageRef.current?.(data)
    })

    source.onerror = () => {
      setConnected(false)
    }

    return () => {
      source.close()
      clearTimeout(maxLifetime)
      setConnected(false)
    }
  }, [])

  return { connected }
}
