import { prisma } from '../db.js'
import { redis } from '../redis.js'
import { emitProjectEvent, emitAdminEvent } from './events.js'
import { notifyAdminNewFeedback, notifyUserFeedbackResponse } from '../admin/notifications.js'

export interface MessageItem {
  readonly id: string
  readonly contentRequestId: string
  readonly authorId: string
  readonly authorRole: string
  readonly body: string
  readonly readAt: string | null
  readonly createdAt: string
}

/**
 * List all messages in a feedback thread, ordered chronologically.
 */
export async function listMessages(contentRequestId: string): Promise<MessageItem[]> {
  const rows = await prisma.message.findMany({
    where: { contentRequestId },
    orderBy: { createdAt: 'asc' },
    take: 200,
  })
  return rows.map(mapRow)
}

/**
 * Create a customer message on a feedback thread.
 * Re-opens the thread if it was completed/rejected.
 */
export async function createCustomerMessage(
  contentRequestId: string,
  authorId: string,
  body: string,
): Promise<MessageItem> {
  const feedback = await prisma.contentRequest.findUnique({
    where: { id: contentRequestId },
    select: {
      id: true,
      projectId: true,
      status: true,
      title: true,
      project: { select: { subdomain: true } },
      user: { select: { email: true } },
    },
  })
  if (!feedback) throw new Error('Feedback not found')

  const message = await prisma.message.create({
    data: { contentRequestId, authorId, authorRole: 'client', body },
  })

  // Re-open if completed/rejected so admin sees it needs attention
  if (feedback.status === 'completed' || feedback.status === 'rejected') {
    await prisma.contentRequest.update({
      where: { id: contentRequestId },
      data: { status: 'in_progress', completedAt: null },
    })
  }

  const item = mapRow(message)

  // SSE: notify project channel + admin channel
  emitProjectEvent(feedback.projectId, {
    type: 'new-message',
    data: { feedbackId: contentRequestId, message: item },
  })
  emitAdminEvent({
    type: 'new-message',
    projectId: feedback.projectId,
    data: { feedbackId: contentRequestId, message: item },
  })

  // Email admin (debounced per thread)
  void notifyWithDebounce(`feedback:${contentRequestId}:admin`, () =>
    notifyAdminNewFeedback(feedback.user.email, feedback.project.subdomain ?? feedback.projectId, feedback.title, body),
  )

  return item
}

/**
 * Create an admin message on a feedback thread. Optionally update status.
 */
export async function createAdminMessage(
  contentRequestId: string,
  authorId: string,
  body: string,
  status?: string,
): Promise<MessageItem> {
  const feedback = await prisma.contentRequest.findUnique({
    where: { id: contentRequestId },
    select: {
      id: true,
      projectId: true,
      title: true,
      user: { select: { id: true, email: true, name: true } },
    },
  })
  if (!feedback) throw new Error('Feedback not found')

  const message = await prisma.message.create({
    data: { contentRequestId, authorId, authorRole: 'admin', body },
  })

  // Update status if provided
  if (status) {
    await prisma.contentRequest.update({
      where: { id: contentRequestId },
      data: {
        status,
        completedAt: status === 'completed' ? new Date() : undefined,
      },
    })
  }

  const item = mapRow(message)

  // SSE: notify project channel
  emitProjectEvent(feedback.projectId, {
    type: 'new-message',
    data: { feedbackId: contentRequestId, message: item },
  })

  // Email customer (debounced per thread)
  void notifyWithDebounce(`feedback:${contentRequestId}:client`, () =>
    notifyUserFeedbackResponse(feedback.user.email, feedback.user.name, feedback.projectId, feedback.title, body),
  )

  return item
}

/**
 * Mark all unread messages from the other party as read.
 */
export async function markMessagesRead(contentRequestId: string, readerRole: 'client' | 'admin'): Promise<number> {
  // Mark messages from the OTHER role as read
  const otherRole = readerRole === 'client' ? 'admin' : 'client'
  const result = await prisma.message.updateMany({
    where: {
      contentRequestId,
      authorRole: otherRole,
      readAt: null,
    },
    data: { readAt: new Date() },
  })
  return result.count
}

/**
 * Get unread message counts for a customer's feedback on a project.
 */
export async function getUnreadCountsForProject(
  projectId: string,
  userId: string,
): Promise<{ total: number; byFeedback: Record<string, number> }> {
  const rows = await prisma.message.groupBy({
    by: ['contentRequestId'],
    where: {
      authorRole: 'admin',
      readAt: null,
      contentRequest: { projectId, userId },
    },
    _count: { id: true },
  })

  const byFeedback: Record<string, number> = {}
  let total = 0
  for (const row of rows) {
    byFeedback[row.contentRequestId] = row._count.id
    total += row._count.id
  }
  return { total, byFeedback }
}

/**
 * Get unread message counts for admin across all projects.
 */
export async function getAdminUnreadCounts(): Promise<{
  total: number
  byFeedback: Record<string, number>
}> {
  const rows = await prisma.message.groupBy({
    by: ['contentRequestId'],
    where: {
      authorRole: 'client',
      readAt: null,
    },
    _count: { id: true },
  })

  const byFeedback: Record<string, number> = {}
  let total = 0
  for (const row of rows) {
    byFeedback[row.contentRequestId] = row._count.id
    total += row._count.id
  }
  return { total, byFeedback }
}

// ============================================================================
// Helpers
// ============================================================================

function mapRow(row: {
  id: string
  contentRequestId: string
  authorId: string
  authorRole: string
  body: string
  readAt: Date | null
  createdAt: Date
}): MessageItem {
  return {
    id: row.id,
    contentRequestId: row.contentRequestId,
    authorId: row.authorId,
    authorRole: row.authorRole,
    body: row.body,
    readAt: row.readAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}

/** Send email notification unless one was sent for this key in the last 15 minutes. */
async function notifyWithDebounce(key: string, send: () => Promise<void>): Promise<void> {
  const redisKey = `email_debounce:${key}`
  const exists = await redis.get(redisKey)
  if (exists) return

  await redis.set(redisKey, '1', 'EX', 900) // 15 min TTL
  await send().catch(() => {})
}
