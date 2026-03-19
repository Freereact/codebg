import { prisma } from '../db.js'
import { PROJECT_STATUS_LABELS } from '../projects/types.js'
import type { AdminProjectsQuery, AdminUsersQuery, AdminFeedbackQuery, CreateNoteInput } from './validation.js'

// ============================================================================
// Stats
// ============================================================================

export interface AdminStats {
  totalProjects: number
  projectsByStatus: Record<string, number>
  pendingFeedback: number
  totalUsers: number
}

export async function getAdminStats(): Promise<AdminStats> {
  const [totalProjects, pendingFeedback, totalUsers, statusCounts] = await Promise.all([
    prisma.project.count({ where: { deletedAt: null } }),
    prisma.contentRequest.count({ where: { status: 'pending' } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.project.groupBy({
      by: ['status'],
      where: { deletedAt: null },
      _count: true,
    }),
  ])

  const projectsByStatus: Record<string, number> = {}
  for (const row of statusCounts) {
    projectsByStatus[row.status] = row._count
  }

  return { totalProjects, projectsByStatus, pendingFeedback, totalUsers }
}

// ============================================================================
// Projects
// ============================================================================

export interface AdminProjectItem {
  readonly id: string
  readonly subdomain: string | null
  readonly templateSlug: string | null
  readonly status: string
  readonly statusLabel: string
  readonly planTier: string | null
  readonly createdAt: string
  readonly updatedAt: string
  readonly user: { id: string; email: string; name: string }
  readonly feedbackCount: number
}

export async function listAdminProjects(
  query: AdminProjectsQuery,
): Promise<{ projects: AdminProjectItem[]; total: number }> {
  const where: Record<string, unknown> = { deletedAt: null }
  if (query.status) where.status = query.status
  if (query.search) {
    where.OR = [
      { subdomain: { contains: query.search, mode: 'insensitive' } },
      { user: { email: { contains: query.search, mode: 'insensitive' } } },
    ]
  }

  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, name: true } },
        _count: { select: { contentRequests: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
  ])

  const projects: AdminProjectItem[] = rows.map((row) => ({
    id: row.id,
    subdomain: row.subdomain,
    templateSlug: row.templateSlug,
    status: row.status,
    statusLabel: PROJECT_STATUS_LABELS[row.status] ?? row.status,
    planTier: row.planTier,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    user: row.user,
    feedbackCount: row._count.contentRequests,
  }))

  return { projects, total }
}

export async function getAdminProjectDetail(projectId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: {
      user: { select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true } },
      contentRequests: { orderBy: { createdAt: 'desc' }, take: 50 },
      adminNotes: { orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }], take: 50 },
    },
  })
}

// ============================================================================
// Users
// ============================================================================

export interface AdminUserItem {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly role: string
  readonly createdAt: string
  readonly projectCount: number
}

export async function listAdminUsers(query: AdminUsersQuery): Promise<{ users: AdminUserItem[]; total: number }> {
  const where: Record<string, unknown> = { deletedAt: null }
  if (query.search) {
    where.OR = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { name: { contains: query.search, mode: 'insensitive' } },
    ]
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { _count: { select: { projects: true } } },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
  ])

  const users: AdminUserItem[] = rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    projectCount: row._count.projects,
  }))

  return { users, total }
}

export async function getAdminUserDetail(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: {
      projects: {
        where: { deletedAt: null },
        orderBy: { updatedAt: 'desc' },
      },
      adminNotes: { orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }], take: 50 },
    },
  })
}

// ============================================================================
// Feedback
// ============================================================================

export interface AdminFeedbackItem {
  readonly id: string
  readonly sectionId: string
  readonly sectionTitle: string
  readonly description: string
  readonly status: string
  readonly adminResponse: string | null
  readonly createdAt: string
  readonly project: { id: string; subdomain: string | null }
  readonly user: { email: string }
}

export async function listAdminFeedback(
  query: AdminFeedbackQuery,
): Promise<{ feedback: AdminFeedbackItem[]; total: number }> {
  const where: Record<string, unknown> = {}
  if (query.status) where.status = query.status

  const [total, rows] = await Promise.all([
    prisma.contentRequest.count({ where }),
    prisma.contentRequest.findMany({
      where,
      include: {
        project: { select: { id: true, subdomain: true } },
        user: { select: { email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit,
      skip: query.offset,
    }),
  ])

  const feedback: AdminFeedbackItem[] = rows.map((row) => {
    const attachments = (row.attachments ?? {}) as Record<string, string>
    return {
      id: row.id,
      sectionId: attachments.sectionId ?? '',
      sectionTitle: attachments.sectionTitle ?? row.title,
      description: row.description,
      status: row.status,
      adminResponse: row.adminResponse,
      createdAt: row.createdAt.toISOString(),
      project: row.project,
      user: row.user,
    }
  })

  return { feedback, total }
}

// ============================================================================
// Notes
// ============================================================================

export interface AdminNoteItem {
  readonly id: string
  readonly content: string
  readonly isPinned: boolean
  readonly createdAt: string
}

export async function createNote(input: CreateNoteInput): Promise<AdminNoteItem> {
  const row = await prisma.adminNote.create({
    data: {
      userId: input.userId,
      projectId: input.projectId,
      content: input.content,
      isPinned: input.isPinned,
    },
  })

  return {
    id: row.id,
    content: row.content,
    isPinned: row.isPinned,
    createdAt: row.createdAt.toISOString(),
  }
}
