import { apiFetch } from './api'

// ============================================================================
// Types
// ============================================================================

export interface AdminStats {
  totalProjects: number
  projectsByStatus: Record<string, number>
  pendingFeedback: number
  totalUsers: number
}

export interface AdminProjectItem {
  id: string
  subdomain: string | null
  templateSlug: string | null
  status: string
  statusLabel: string
  planTier: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; email: string; name: string }
  feedbackCount: number
}

export interface AdminUserItem {
  id: string
  email: string
  name: string
  role: string
  createdAt: string
  projectCount: number
}

export interface AdminFeedbackItem {
  id: string
  sectionId: string
  sectionTitle: string
  description: string
  status: string
  adminResponse: string | null
  createdAt: string
  project: { id: string; subdomain: string | null }
  user: { email: string }
}

interface PaginatedResult<T> {
  ok: true
  data: T[]
  pagination: { total: number; limit: number; offset: number; hasMore: boolean }
}

type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string }

// ============================================================================
// API Functions
// ============================================================================

export async function fetchAdminStats(): Promise<ApiResult<AdminStats>> {
  return apiFetch('/api/admin/stats')
}

export async function fetchAdminProjects(
  params: { status?: string; search?: string; limit?: number; offset?: number } = {},
): Promise<PaginatedResult<AdminProjectItem> | { ok: false; error: string }> {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.search) qs.set('search', params.search)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))
  return apiFetch(`/api/admin/projects?${qs}`)
}

export async function fetchAdminProject(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiFetch(`/api/admin/projects/${id}`)
}

export async function updateProjectStatus(id: string, status: string): Promise<ApiResult<unknown>> {
  return apiFetch(`/api/admin/projects/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) })
}

export async function rebuildProject(id: string): Promise<ApiResult<unknown>> {
  return apiFetch(`/api/admin/projects/${id}/rebuild`, { method: 'POST' })
}

export async function fetchAdminUsers(
  params: { search?: string; limit?: number; offset?: number } = {},
): Promise<PaginatedResult<AdminUserItem> | { ok: false; error: string }> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))
  return apiFetch(`/api/admin/users?${qs}`)
}

export async function fetchAdminFeedback(
  params: { status?: string; limit?: number; offset?: number } = {},
): Promise<PaginatedResult<AdminFeedbackItem> | { ok: false; error: string }> {
  const qs = new URLSearchParams()
  if (params.status) qs.set('status', params.status)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))
  return apiFetch(`/api/admin/feedback?${qs}`)
}

export async function respondToFeedback(
  feedbackId: string,
  adminResponse: string,
  status = 'completed',
): Promise<ApiResult<unknown>> {
  return apiFetch(`/api/admin/feedback/${feedbackId}`, {
    method: 'PATCH',
    body: JSON.stringify({ adminResponse, status }),
  })
}

export async function createAdminNote(input: {
  userId?: string
  projectId?: string
  content: string
}): Promise<ApiResult<unknown>> {
  return apiFetch('/api/admin/notes', { method: 'POST', body: JSON.stringify(input) })
}

// ============================================================================
// Messages (threaded conversations on feedback items)
// ============================================================================

export interface AdminMessageItem {
  id: string
  contentRequestId: string
  authorId: string
  authorRole: string
  body: string
  readAt: string | null
  createdAt: string
}

export interface AdminUnreadCounts {
  total: number
  byFeedback: Record<string, number>
}

export async function fetchAdminMessages(feedbackId: string): Promise<ApiResult<AdminMessageItem[]>> {
  return apiFetch(`/api/admin/feedback/${feedbackId}/messages`)
}

export async function sendAdminMessage(
  feedbackId: string,
  body: string,
  status?: string,
): Promise<ApiResult<AdminMessageItem>> {
  return apiFetch(`/api/admin/feedback/${feedbackId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body, status }),
  })
}

export async function markAdminMessagesRead(
  feedbackId: string,
): Promise<{ ok: true; markedCount: number } | { ok: false; error: string }> {
  return apiFetch(`/api/admin/feedback/${feedbackId}/messages/read`, {
    method: 'POST',
  })
}

export async function fetchAdminUnreadCounts(): Promise<ApiResult<AdminUnreadCounts>> {
  return apiFetch('/api/admin/feedback/unread')
}

// ============================================================================
// Site Mode
// ============================================================================

export async function fetchSiteMode(): Promise<ApiResult<{ mode: string }>> {
  return apiFetch('/api/admin/site-mode')
}

export async function updateSiteMode(mode: string): Promise<ApiResult<{ mode: string }>> {
  return apiFetch('/api/admin/site-mode', { method: 'PUT', body: JSON.stringify({ mode }) })
}
