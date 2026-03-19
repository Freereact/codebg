import type { ProjectListItem, ProjectDetail, PaginatedResponse, TemplateMeta, CreateProjectInput } from '../types/portal'

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

export async function fetchProjects(
  limit = 20,
  offset = 0,
): Promise<PaginatedResponse<ProjectListItem> | { ok: false; error: string }> {
  return apiFetch(`/api/projects?limit=${limit}&offset=${offset}`)
}

export async function fetchProject(id: string): Promise<{ ok: true; data: ProjectDetail } | { ok: false; error: string }> {
  return apiFetch(`/api/projects/${id}`)
}

export async function fetchTemplates(): Promise<{ ok: true; data: TemplateMeta[] } | { ok: false; error: string }> {
  return apiFetch('/api/projects/templates')
}

export async function createProject(
  input: CreateProjectInput,
): Promise<{ ok: true; data: ProjectDetail } | { ok: false; error: string }> {
  return apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}
