import path from 'node:path'
import { prisma } from '../db.js'
import { config } from '../config.js'
import type { ProjectListItem, ProjectDetail, UserProfile, ProjectStatus, PlanTier, DomainStatus } from './types.js'
import type { UserRole } from '../auth/types.js'
import { PROJECT_STATUS_LABELS as statusLabels } from './types.js'
import type { CreateProjectBody, UpdateProjectBody, TemplateSlug } from './site-config-schema.js'
import { businessInfoSchema } from './site-config-schema.js'
import { generateUniqueSubdomain } from './subdomain.js'
import { initProjectRepo, updateOverrides as updateRepoOverrides, getVerifiedRepoPath } from './repo-service.js'
import { buildProject } from './build-service.js'
import { createArchive } from './git-service.js'
import { emitProjectEvent } from './events.js'
import { createGitHubRepo, pushToGitHub } from '../github/index.js'
import { notifyUserPreviewReady, notifyAdminBuildFailed } from '../admin/notifications.js'

const projectListSelect = {
  id: true,
  status: true,
  domain: true,
  domainStatus: true,
  subdomain: true,
  templateSlug: true,
  planTier: true,
  createdAt: true,
  updatedAt: true,
} as const

/** Cast Prisma string to ProjectStatus at the DB→API boundary */
const asStatus = (s: string) => s as ProjectStatus
const asPlanTier = (s: string | null) => s as PlanTier | null
const asSiteConfig = (v: unknown) => (v ?? {}) as Record<string, unknown>

function toStatusLabel(status: string): string {
  return statusLabels[status as ProjectStatus] ?? status
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
    status: asStatus(row.status),
    statusLabel: toStatusLabel(row.status),
    domain: row.domain,
    domainStatus: (row.domainStatus as DomainStatus) ?? null,
    subdomain: row.subdomain,
    templateSlug: row.templateSlug,
    planTier: asPlanTier(row.planTier),
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
    status: asStatus(row.status),
    statusLabel: toStatusLabel(row.status),
    domain: row.domain,
    domainStatus: (row.domainStatus as DomainStatus) ?? null,
    subdomain: row.subdomain,
    templateSlug: row.templateSlug,
    planTier: asPlanTier(row.planTier),
    siteConfig: asSiteConfig(row.siteConfig),
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
    status: asStatus(project.status),
    statusLabel: toStatusLabel(project.status),
    domain: project.domain,
    domainStatus: (project.domainStatus as DomainStatus) ?? null,
    subdomain: project.subdomain,
    templateSlug: project.templateSlug,
    planTier: asPlanTier(project.planTier),
    siteConfig: asSiteConfig(project.siteConfig),
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
    emitProjectEvent(projectId, { type: 'progress', data: { step: 'scaffolding' } })
    const { repoPath } = await initProjectRepo({ projectId, templateSlug, subdomain, businessInfo })
    console.log(`[build] repo scaffolded for ${projectId}`)

    emitProjectEvent(projectId, { type: 'progress', data: { step: 'building' } })
    await prisma.project.update({ where: { id: projectId }, data: { status: 'building' } })
    emitProjectEvent(projectId, { type: 'status', data: { status: 'building' } })
    console.log(`[build] status → building for ${projectId}`)

    const result = await buildProject(repoPath, subdomain)
    console.log(`[build] result for ${projectId}: ${result.status} (${result.durationMs ?? 0}ms)`)

    // If project has an active custom domain, also build with --base=/
    const proj = await prisma.project.findFirst({ where: { id: projectId }, select: { domainStatus: true } })
    if (result.status === 'success' && proj?.domainStatus === 'active') {
      const customResult = await buildProject(repoPath, subdomain, '/')
      console.log(`[build] custom-domain build for ${projectId}: ${customResult.status}`)
    }

    if (result.status === 'success') {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'preview', draftReadyAt: new Date() },
      })
      emitProjectEvent(projectId, { type: 'status', data: { status: 'preview' } })
      emitProjectEvent(projectId, { type: 'build-complete', data: { durationMs: result.durationMs ?? 0 } })
      console.log(`[build] status → preview for ${projectId}`)

      // Notify user that preview is ready (fire-and-forget)
      void (async () => {
        try {
          const p = await prisma.project.findFirst({ where: { id: projectId }, include: { user: true } })
          if (p?.user) {
            await notifyUserPreviewReady(
              p.user.email,
              p.user.email.split('@')[0],
              businessInfo.name,
              subdomain,
              projectId,
            )
          }
        } catch (e) {
          console.error(`[notify] preview-ready failed for ${projectId}:`, e instanceof Error ? e.message : 'unknown')
        }
      })()

      // Push to GitHub (fire-and-forget, don't block the build)
      try {
        const { cloneUrl, htmlUrl } = await createGitHubRepo(subdomain, `${businessInfo.name} — built with CodeBG`)
        await pushToGitHub(repoPath, cloneUrl)
        await prisma.project.update({ where: { id: projectId }, data: { githubUrl: htmlUrl } })
        console.log(`[github] repo created for ${projectId}: ${htmlUrl}`)
      } catch (ghErr) {
        // GitHub push is optional — don't fail the build
        console.error(`[github] failed for ${projectId}:`, ghErr instanceof Error ? ghErr.message : 'unknown')
      }
    } else {
      await prisma.project.update({ where: { id: projectId }, data: { status: 'draft' } })
      emitProjectEvent(projectId, { type: 'error', data: { message: result.message ?? 'Build failed' } })
      emitProjectEvent(projectId, { type: 'status', data: { status: 'draft' } })
      console.error(`[build] failed for ${projectId}: ${result.message}`)
      notifyAdminBuildFailed(subdomain, result.message ?? 'Build failed').catch(() => {})
    }
  } catch (err) {
    console.error(`[build] pipeline error for ${projectId}:`, err instanceof Error ? err.message : 'unknown')
    emitProjectEvent(projectId, { type: 'error', data: { message: 'Build pipeline error' } })
    await prisma.project.update({ where: { id: projectId }, data: { status: 'draft' } }).catch(() => {})
    notifyAdminBuildFailed(subdomain, err instanceof Error ? err.message : 'Build pipeline error').catch(() => {})
  }
}

/**
 * Download project as ZIP (git archive). Verifies ownership.
 */
export async function downloadProject(projectId: string, userId: string): Promise<Buffer | null> {
  const repoPath = await getVerifiedRepoPath(projectId, userId).catch(() => null)
  if (!repoPath) return null
  return createArchive(repoPath)
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

  // Update overrides.json + git commit, then rebuild
  const repoPath = path.join(config.projectsDir, project.id)
  const rebuildName = project.subdomain ?? projectId
  updateRepoOverrides(projectId, userId, validatedBizInfo.data)
    .then(async () => {
      await prisma.project.update({ where: { id: projectId }, data: { status: 'building' } })
      const result = await buildProject(repoPath, rebuildName)
      const newStatus = result.status === 'success' ? 'preview' : 'draft'
      await prisma.project.update({ where: { id: projectId }, data: { status: newStatus } })
      if (result.status !== 'success') {
        notifyAdminBuildFailed(rebuildName, result.message ?? 'Rebuild failed').catch(() => {})
      }
    })
    .catch((err) => {
      console.error(`[projects] rebuild failed for ${project.id}:`, err instanceof Error ? err.message : 'unknown')
      notifyAdminBuildFailed(rebuildName, err instanceof Error ? err.message : 'Rebuild failed').catch(() => {})
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
  const { rm } = await import('node:fs/promises')
  const wsDir = path.join(config.projectsDir, projectId)
  const siteDir = existing.subdomain ? path.join(config.sitesDir, existing.subdomain) : null
  await rm(wsDir, { recursive: true, force: true }).catch(() => {})
  if (siteDir) await rm(siteDir, { recursive: true, force: true }).catch(() => {})

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
    role: user.role as UserRole,
    createdAt: user.createdAt.toISOString(),
  }
}
