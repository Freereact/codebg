import { prisma } from '../db.js'
import { config } from '../config.js'
import type { ProjectListItem, ProjectDetail, UserProfile } from './types.js'
import { PROJECT_STATUS_LABELS as statusLabels } from './types.js'
import type { CreateProjectBody, UpdateProjectBody, TemplateSlug } from './site-config-schema.js'
import { businessInfoSchema } from './site-config-schema.js'
import { generateUniqueSubdomain } from './subdomain.js'
import { createWorkspace } from './workspace-service.js'
import { buildProject } from './build-service.js'

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

export async function createProject(userId: string, input: CreateProjectBody): Promise<ProjectDetail> {
  const subdomain = await generateUniqueSubdomain(input.businessInfo.name, async (sub) => {
    const existing = await prisma.project.findFirst({
      where: { subdomain: sub, deletedAt: null },
      select: { id: true },
    })
    return existing !== null
  })

  const siteConfig = { templateSlug: input.templateSlug, businessInfo: input.businessInfo }

  const project = await prisma.project.create({
    data: {
      userId,
      templateSlug: input.templateSlug,
      subdomain,
      status: 'draft',
      siteConfig,
    },
  })

  // Create workspace and trigger build (fire-and-forget)
  runProjectBuild(project.id, input.templateSlug as TemplateSlug, subdomain, input.businessInfo).catch((err) => {
    console.error(`[projects] build pipeline failed for ${project.id}:`, err instanceof Error ? err.message : 'unknown')
  })

  return {
    id: project.id,
    status: project.status,
    statusLabel: toStatusLabel(project.status),
    domain: project.domain,
    subdomain: project.subdomain,
    templateSlug: project.templateSlug,
    planTier: project.planTier,
    siteConfig: project.siteConfig,
    setupFeeCents: project.setupFeeCents,
    paidAt: project.paidAt?.toISOString() ?? null,
    briefReceivedAt: project.briefReceivedAt?.toISOString() ?? null,
    draftReadyAt: project.draftReadyAt?.toISOString() ?? null,
    launchedAt: project.launchedAt?.toISOString() ?? null,
    cancelledAt: project.cancelledAt?.toISOString() ?? null,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  }
}

async function runProjectBuild(
  projectId: string,
  templateSlug: TemplateSlug,
  subdomain: string,
  businessInfo: CreateProjectBody['businessInfo'],
): Promise<void> {
  try {
    await createWorkspace({ projectId, templateSlug, subdomain, businessInfo })
    console.log(`[build] workspace created for ${projectId}`)

    await prisma.project.update({ where: { id: projectId }, data: { status: 'building' } })
    console.log(`[build] status → building for ${projectId}`)

    const result = await buildProject(projectId, subdomain)
    console.log(`[build] result for ${projectId}: ${result.status} (${result.durationMs ?? 0}ms)`)

    if (result.status === 'success') {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'preview', draftReadyAt: new Date() },
      })
      console.log(`[build] status → preview for ${projectId}`)
    } else {
      // Reset to draft so user can retry
      await prisma.project.update({ where: { id: projectId }, data: { status: 'draft' } })
      console.error(`[build] failed for ${projectId}: ${result.message}`)
    }
  } catch (err) {
    console.error(`[build] pipeline error for ${projectId}:`, err instanceof Error ? err.message : 'unknown')
    // Try to reset status to draft
    await prisma.project.update({ where: { id: projectId }, data: { status: 'draft' } }).catch(() => {})
  }
}

export async function updateProjectSiteConfig(
  projectId: string,
  userId: string,
  input: UpdateProjectBody,
): Promise<ProjectDetail | null> {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, userId, deletedAt: null },
  })

  if (!existing) return null

  const currentConfig = (existing.siteConfig as Record<string, unknown>) ?? {}
  const currentBizInfo = (currentConfig.businessInfo as Record<string, unknown>) ?? {}
  const mergedBizInfo = { ...currentBizInfo, ...input.businessInfo }

  // Re-validate merged result to prevent malformed data from reaching the workspace
  const validatedBizInfo = businessInfoSchema.safeParse(mergedBizInfo)
  if (!validatedBizInfo.success) return null

  const newSiteConfig = { ...currentConfig, businessInfo: validatedBizInfo.data }

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { siteConfig: newSiteConfig },
  })

  // Rebuild in background
  runProjectBuild(
    project.id,
    (project.templateSlug ?? existing.templateSlug ?? 'autoshop') as TemplateSlug,
    project.subdomain ?? projectId,
    mergedBizInfo as CreateProjectBody['businessInfo'],
  ).catch((err) => {
    console.error(`[projects] rebuild failed for ${project.id}:`, err instanceof Error ? err.message : 'unknown')
  })

  return findProjectByIdForUser(projectId, userId)
}

export async function deleteProject(projectId: string, userId: string): Promise<boolean> {
  const existing = await prisma.project.findFirst({
    where: { id: projectId, userId, deletedAt: null },
    select: { id: true, subdomain: true },
  })

  if (!existing) return false

  await prisma.project.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  })

  // Clean up workspace and built site (best-effort)
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const wsDir = path.join(config.projectsDir, projectId)
  const siteDir = existing.subdomain ? path.join(config.sitesDir, existing.subdomain) : null
  await fs.rm(wsDir, { recursive: true, force: true }).catch(() => {})
  if (siteDir) await fs.rm(siteDir, { recursive: true, force: true }).catch(() => {})

  return true
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
