import { createContext, useContext } from 'react'
import type { AuthState, AuthUser } from '../types/auth'

export interface AuthContextValue {
  state: AuthState
  setUser: (user: AuthUser) => void
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
