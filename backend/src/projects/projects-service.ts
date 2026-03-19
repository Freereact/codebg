import { prisma } from '../db.js'
import type { ProjectListItem, ProjectDetail, UserProfile } from './types.js'
import { PROJECT_STATUS_LABELS as statusLabels } from './types.js'

const projectListSelect = {
  id: true,
  status: true,
  domain: true,
  subdomain: true,
  templateSlug: true,
  planTier: true,
  createdAt: true,
  updatedAt: true,
} as const

function toStatusLabel(status: string): string {
  return statusLabels[status] ?? status
}

export async function listProjectsForUser(
  userId: string,
  limit: number,
  offset: number,
): Promise<{ projects: ProjectListItem[]; total: number }> {
  const where = { userId, deletedAt: null }

  const [total, rows] = await Promise.all([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      select: projectListSelect,
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ])

  const projects: ProjectListItem[] = rows.map((row) => ({
    id: row.id,
    status: row.status,
    statusLabel: toStatusLabel(row.status),
    domain: row.domain,
    subdomain: row.subdomain,
    templateSlug: row.templateSlug,
    planTier: row.planTier,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }))

  return { projects, total }
}

export async function findProjectByIdForUser(projectId: string, userId: string): Promise<ProjectDetail | null> {
  const row = await prisma.project.findFirst({
    where: { id: projectId, userId, deletedAt: null },
    select: {
      ...projectListSelect,
      siteConfig: true,
      setupFeeCents: true,
      paidAt: true,
      briefReceivedAt: true,
      draftReadyAt: true,
      launchedAt: true,
      cancelledAt: true,
    },
  })

  if (!row) return null

  return {
    id: row.id,
    status: row.status,
    statusLabel: toStatusLabel(row.status),
    domain: row.domain,
    subdomain: row.subdomain,
    templateSlug: row.templateSlug,
    planTier: row.planTier,
    siteConfig: row.siteConfig,
    setupFeeCents: row.setupFeeCents,
    paidAt: row.paidAt?.toISOString() ?? null,
    briefReceivedAt: row.briefReceivedAt?.toISOString() ?? null,
    draftReadyAt: row.draftReadyAt?.toISOString() ?? null,
    launchedAt: row.launchedAt?.toISOString() ?? null,
    cancelledAt: row.cancelledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      role: true,
      createdAt: true,
    },
  })

  if (!user) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  }
}
