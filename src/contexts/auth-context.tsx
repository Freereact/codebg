import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { AuthState, AuthUser } from '../types/auth'
import { fetchMe, logout as apiLogout } from '../lib/auth-api'

interface AuthContextValue {
  state: AuthState
  setUser: (user: AuthUser) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  useEffect(() => {
    fetchMe()
      .then((res) => {
        if (res.ok && res.user) {
          setState({ status: 'authenticated', user: res.user })
        } else {
          setState({ status: 'unauthenticated' })
        }
      })
      .catch(() => {
        setState({ status: 'unauthenticated' })
      })
  }, [])

  const setUser = useCallback((user: AuthUser) => {
    setState({ status: 'authenticated', user })
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setState({ status: 'unauthenticated' })
  }, [])

  return <AuthContext.Provider value={{ state, setUser, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
