import { apiFetch } from './api'

export interface FeedbackItem {
  readonly id: string
  readonly sectionId: string
  readonly sectionTitle: string
  readonly description: string
  readonly status: string
  readonly adminResponse: string | null
  readonly completedAt: string | null
  readonly createdAt: string
}

export async function createFeedback(
  projectId: string,
  input: { sectionId: string; sectionTitle: string; description: string },
): Promise<{ ok: true; data: FeedbackItem } | { ok: false; error: string }> {
  return apiFetch(`/api/projects/${projectId}/feedback`, {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export async function fetchFeedback(
  projectId: string,
): Promise<{ ok: true; data: FeedbackItem[] } | { ok: false; error: string }> {
  return apiFetch(`/api/projects/${projectId}/feedback`)
}
