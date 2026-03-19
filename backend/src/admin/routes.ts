import path from 'node:path'
import { Router } from 'express'
import type { Response } from 'express'
import { requireAdmin } from '../auth/middleware.js'
import type { AuthenticatedRequest } from '../auth/types.js'
import { config } from '../config.js'
import { projectIdSchema } from '../projects/validation.js'
import { PROJECT_STATUS_LABELS } from '../projects/types.js'
import { buildProject } from '../projects/build-service.js'
import { updateFeedback } from '../projects/feedback-service.js'
import { updateFeedbackSchema, feedbackIdSchema } from '../projects/feedback-validation.js'
import {
  getAdminStats,
  listAdminProjects,
  getAdminProjectDetail,
  listAdminUsers,
  getAdminUserDetail,
  listAdminFeedback,
  createNote,
} from './admin-service.js'
import {
  adminProjectsQuerySchema,
  adminUsersQuerySchema,
  adminFeedbackQuerySchema,
  updateProjectStatusSchema,
  createNoteSchema,
} from './validation.js'
import { notifyUserFeedbackResponse, notifyUserStatusChange } from './notifications.js'
import { prisma } from '../db.js'

export const adminRouter = Router()

// All routes require admin role
adminRouter.use(requireAdmin)

// ============================================================================
// Stats
// ============================================================================

adminRouter.get('/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await getAdminStats()
    return res.json({ ok: true, data: stats })
  } catch (err) {
    console.error('[admin] stats error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// ============================================================================
// Projects
// ============================================================================

adminRouter.get('/projects', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = adminProjectsQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_query' })

    const { projects, total } = await listAdminProjects(parsed.data)
    return res.json({
      ok: true,
      data: projects,
      pagination: {
        total,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
        hasMore: parsed.data.offset + projects.length < total,
      },
    })
  } catch (err) {
    console.error('[admin] projects error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

adminRouter.get('/projects/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = projectIdSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_project_id' })

    const project = await getAdminProjectDetail(parsed.data.id)
    if (!project) return res.status(404).json({ ok: false, error: 'project_not_found' })

    return res.json({ ok: true, data: project })
  } catch (err) {
    console.error('[admin] project detail error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

adminRouter.patch('/projects/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idParsed = projectIdSchema.safeParse(req.params)
    if (!idParsed.success) return res.status(400).json({ ok: false, error: 'invalid_project_id' })

    const bodyParsed = updateProjectStatusSchema.safeParse(req.body)
    if (!bodyParsed.success) return res.status(400).json({ ok: false, error: 'invalid_payload' })

    const project = await prisma.project.findFirst({
      where: { id: idParsed.data.id, deletedAt: null },
      include: { user: { select: { email: true, name: true } } },
    })
    if (!project) return res.status(404).json({ ok: false, error: 'project_not_found' })

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: { status: bodyParsed.data.status },
    })

    // Email notification to user
    const statusLabel = PROJECT_STATUS_LABELS[bodyParsed.data.status] ?? bodyParsed.data.status
    notifyUserStatusChange(project.user.email, project.user.name, project.subdomain ?? 'your site', statusLabel).catch(
      () => {},
    )

    return res.json({ ok: true, data: { ...updated, statusLabel } })
  } catch (err) {
    console.error('[admin] update project error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

adminRouter.post('/projects/:id/rebuild', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = projectIdSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_project_id' })

    const project = await prisma.project.findFirst({
      where: { id: parsed.data.id, deletedAt: null },
    })
    if (!project || !project.subdomain) return res.status(404).json({ ok: false, error: 'project_not_found' })

    const repoPath = path.join(config.projectsDir, project.id)
    await prisma.project.update({ where: { id: project.id }, data: { status: 'building' } })

    // Fire-and-forget build
    buildProject(repoPath, project.subdomain)
      .then(async (result) => {
        const newStatus = result.status === 'success' ? 'preview' : 'draft'
        await prisma.project.update({ where: { id: project.id }, data: { status: newStatus } })
      })
      .catch(() => {})

    return res.json({ ok: true, data: { status: 'building' } })
  } catch (err) {
    console.error('[admin] rebuild error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// ============================================================================
// Users
// ============================================================================

adminRouter.get('/users', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = adminUsersQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_query' })

    const { users, total } = await listAdminUsers(parsed.data)
    return res.json({
      ok: true,
      data: users,
      pagination: {
        total,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
        hasMore: parsed.data.offset + users.length < total,
      },
    })
  } catch (err) {
    console.error('[admin] users error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

adminRouter.get('/users/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id
    const user = await getAdminUserDetail(id)
    if (!user) return res.status(404).json({ ok: false, error: 'user_not_found' })

    return res.json({ ok: true, data: user })
  } catch (err) {
    console.error('[admin] user detail error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// ============================================================================
// Feedback
// ============================================================================

adminRouter.get('/feedback', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = adminFeedbackQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_query' })

    const { feedback, total } = await listAdminFeedback(parsed.data)
    return res.json({
      ok: true,
      data: feedback,
      pagination: {
        total,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
        hasMore: parsed.data.offset + feedback.length < total,
      },
    })
  } catch (err) {
    console.error('[admin] feedback error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

adminRouter.patch('/feedback/:feedbackId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idParsed = feedbackIdSchema.safeParse(req.params)
    if (!idParsed.success) return res.status(400).json({ ok: false, error: 'invalid_feedback_id' })

    const bodyParsed = updateFeedbackSchema.safeParse(req.body)
    if (!bodyParsed.success) return res.status(400).json({ ok: false, error: 'invalid_payload' })

    const updated = await updateFeedback(idParsed.data.feedbackId, bodyParsed.data)
    if (!updated) return res.status(404).json({ ok: false, error: 'feedback_not_found' })

    // If admin responded, email the user
    if (bodyParsed.data.adminResponse) {
      const feedbackRow = await prisma.contentRequest.findUnique({
        where: { id: idParsed.data.feedbackId },
        include: {
          user: { select: { email: true, name: true } },
          project: { select: { id: true } },
        },
      })
      if (feedbackRow) {
        notifyUserFeedbackResponse(
          feedbackRow.user.email,
          feedbackRow.user.name,
          feedbackRow.project.id,
          updated.sectionTitle,
          bodyParsed.data.adminResponse,
        ).catch(() => {})
      }
    }

    return res.json({ ok: true, data: updated })
  } catch (err) {
    console.error('[admin] feedback update error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// ============================================================================
// Notes
// ============================================================================

adminRouter.post('/notes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createNoteSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_payload' })

    const note = await createNote(parsed.data)
    return res.status(201).json({ ok: true, data: note })
  } catch (err) {
    console.error('[admin] create note error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})
