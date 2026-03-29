import type { AuthUser } from '../types/auth'
import { apiFetch } from './api'

export async function requestMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  return apiFetch('/api/auth/magic-link', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyToken(token: string): Promise<{ ok: boolean; user?: AuthUser; error?: string }> {
  return apiFetch('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  })
}

export async function fetchMe(): Promise<{ ok: boolean; user?: AuthUser }> {
  return apiFetch('/api/auth/me')
}

export async function logout(): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/logout', { method: 'POST' })
}
