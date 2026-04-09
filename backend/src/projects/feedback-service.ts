import { prisma } from '../db.js'
import type { CreateFeedbackInput, UpdateFeedbackInput } from './feedback-validation.js'
import { notifyAdminNewFeedback } from '../admin/notifications.js'
import { emitAdminEvent } from './events.js'

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
  userId: string,
  input: CreateFeedbackInput,
): Promise<FeedbackItem> {
  const row = await prisma.contentRequest.create({
    data: {
      projectId,
      userId,
      title: input.sectionTitle,
      description: input.description,
      attachments: { sectionId: input.sectionId, sectionTitle: input.sectionTitle },
    },
  })

  // Seed the initial message so the conversation thread is never empty
  const message = await prisma.message.create({
    data: {
      contentRequestId: row.id,
      authorId: userId,
      authorRole: 'client',
      body: input.description,
    },
  })

  // SSE: notify admin channel about new feedback
  emitAdminEvent({
    type: 'new-message',
    projectId,
    data: {
      feedbackId: row.id,
      message: {
        id: message.id,
        contentRequestId: row.id,
        authorId: userId,
        authorRole: 'client',
        body: input.description,
        readAt: null,
        createdAt: message.createdAt.toISOString(),
      },
    },
  })

  // Notify admin about new feedback (fire-and-forget)
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { subdomain: true } })
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } })
  if (project && user) {
    notifyAdminNewFeedback(user.email, project.subdomain ?? projectId, input.sectionTitle, input.description).catch(
      () => {},
    )
  }

  return mapRow(row)
}

export async function listFeedback(projectId: string, userId: string): Promise<FeedbackItem[]> {
  const rows = await prisma.contentRequest.findMany({
    where: { projectId, userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return rows.map(mapRow)
}

export async function updateFeedback(feedbackId: string, input: UpdateFeedbackInput): Promise<FeedbackItem | null> {
  const existing = await prisma.contentRequest.findUnique({ where: { id: feedbackId } })
  if (!existing) return null

  const row = await prisma.contentRequest.update({
    where: { id: feedbackId },
    data: {
      status: input.status,
      adminResponse: input.adminResponse,
      completedAt: input.status === 'completed' ? new Date() : undefined,
    },
  })

  return mapRow(row)
}

function mapRow(row: {
  id: string
  title: string
  description: string
  attachments: unknown
  status: string
  adminResponse: string | null
  completedAt: Date | null
  createdAt: Date
}): FeedbackItem {
  const attachments = (row.attachments ?? {}) as Record<string, string>
  return {
    id: row.id,
    sectionId: attachments.sectionId ?? '',
    sectionTitle: attachments.sectionTitle ?? row.title,
    description: row.description,
    status: row.status,
    adminResponse: row.adminResponse,
    completedAt: row.completedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
  }
}
