import { Router } from 'express'
import type { Response } from 'express'
import { requireAuth } from '../auth/middleware.js'
import { listProjectsForUser, findProjectByIdForUser, getUserProfile } from './projects-service.js'
import { listProjectsQuerySchema, projectIdSchema } from './validation.js'
import type { AuthenticatedRequest } from '../auth/types.js'

/** Defensively extract user sub from req.user (guaranteed by requireAuth) */
function getUserId(req: AuthenticatedRequest): string {
  if (!req.user) throw new Error('requireAuth did not populate req.user')
  return req.user.sub
}

export const projectsRouter = Router()

projectsRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = listProjectsQuerySchema.safeParse(req.query)
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_query' })
    }

    const { limit, offset } = parsed.data
    const { projects, total } = await listProjectsForUser(getUserId(req), limit, offset)

    return res.json({
      ok: true,
      data: projects,
      pagination: { total, limit, offset, hasMore: offset + projects.length < total },
    })
  } catch (err) {
    console.error('[projects] list error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

projectsRouter.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = projectIdSchema.safeParse(req.params)
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_project_id' })
    }

    const project = await findProjectByIdForUser(parsed.data.id, getUserId(req))
    if (!project) {
      return res.status(404).json({ ok: false, error: 'project_not_found' })
    }

    return res.json({ ok: true, data: project })
  } catch (err) {
    console.error('[projects] get error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

export const usersRouter = Router()

usersRouter.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await getUserProfile(getUserId(req))
    if (!user) {
      return res.status(401).json({ ok: false, error: 'user_not_found' })
    }
    return res.json({ ok: true, data: user })
  } catch (err) {
    console.error('[users] me error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})
