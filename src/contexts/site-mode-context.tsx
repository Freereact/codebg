import { createContext, useContext, useEffect, useState } from 'react'
import { apiFetch } from '../lib/api'

export type SiteMode = 'normal' | 'maintenance' | 'test'

interface SiteModeContextValue {
  mode: SiteMode
  loading: boolean
}

const SiteModeContext = createContext<SiteModeContextValue>({ mode: 'normal', loading: true })

export function SiteModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<SiteMode>('normal')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function fetchMode() {
      try {
        const res = await apiFetch<{ ok: boolean; mode: SiteMode }>('/api/site-mode')
        if (mounted && res.mode) setMode(res.mode)
      } catch {
        // If fetch fails, assume normal
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchMode()
    const interval = setInterval(fetchMode, 30_000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  return <SiteModeContext.Provider value={{ mode, loading }}>{children}</SiteModeContext.Provider>
}

export function useSiteMode() {
  return useContext(SiteModeContext)
}
