import type {
  ProjectListItem,
  ProjectDetail,
  PaginatedResponse,
  TemplateMeta,
  CreateProjectInput,
} from '../types/portal'
import { apiFetch } from './api'

export async function fetchProjects(
  limit = 20,
  offset = 0,
): Promise<PaginatedResponse<ProjectListItem> | { ok: false; error: string }> {
  return apiFetch(`/api/projects?limit=${limit}&offset=${offset}`)
}

export async function fetchProject(
  id: string,
): Promise<{ ok: true; data: ProjectDetail } | { ok: false; error: string }> {
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

export async function updateProject(
  id: string,
  body: { businessInfo?: Record<string, string>; comingSoon?: boolean },
): Promise<{ ok: true; data: ProjectDetail } | { ok: false; error: string }> {
  return apiFetch(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function deleteProjectApi(id: string): Promise<{ ok: boolean; error?: string }> {
  return apiFetch(`/api/projects/${id}`, { method: 'DELETE' })
}
