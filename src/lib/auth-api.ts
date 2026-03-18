import type { AuthUser } from '../types/auth'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: (body as Record<string, unknown>).error ?? `HTTP ${res.status}` } as T
  }

  return res.json() as Promise<T>
}

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
