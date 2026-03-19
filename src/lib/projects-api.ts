import type { ProjectListItem, PaginatedResponse } from '../types/portal'

const API_BASE = import.meta.env.VITE_API_URL ?? ''

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    return { ok: false, error: (body as Record<string, unknown>).error ?? `HTTP ${res.status}` } as T
  }

  return res.json() as Promise<T>
}

export async function fetchProjects(
  limit = 20,
  offset = 0,
): Promise<PaginatedResponse<ProjectListItem> | { ok: false; error: string }> {
  return apiFetch(`/api/projects?limit=${limit}&offset=${offset}`)
}
