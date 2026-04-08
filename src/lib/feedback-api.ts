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

export interface MessageItem {
  readonly id: string
  readonly contentRequestId: string
  readonly authorId: string
  readonly authorRole: string
  readonly body: string
  readonly readAt: string | null
  readonly createdAt: string
}

export interface UnreadCounts {
  total: number
  byFeedback: Record<string, number>
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

export async function fetchMessages(
  projectId: string,
  feedbackId: string,
): Promise<{ ok: true; data: MessageItem[] } | { ok: false; error: string }> {
  return apiFetch(`/api/projects/${projectId}/feedback/${feedbackId}/messages`)
}

export async function sendMessage(
  projectId: string,
  feedbackId: string,
  body: string,
): Promise<{ ok: true; data: MessageItem } | { ok: false; error: string }> {
  return apiFetch(`/api/projects/${projectId}/feedback/${feedbackId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  })
}

export async function markMessagesRead(
  projectId: string,
  feedbackId: string,
): Promise<{ ok: true; markedCount: number } | { ok: false; error: string }> {
  return apiFetch(`/api/projects/${projectId}/feedback/${feedbackId}/messages/read`, {
    method: 'POST',
  })
}

export async function fetchUnreadCounts(
  projectId: string,
): Promise<{ ok: true; data: UnreadCounts } | { ok: false; error: string }> {
  return apiFetch(`/api/projects/${projectId}/feedback/unread`)
}
