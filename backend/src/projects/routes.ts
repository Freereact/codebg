import path from 'node:path'
import { Router } from 'express'
import type { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { requireAuth } from '../auth/middleware.js'
import { config } from '../config.js'
import { prisma } from '../db.js'
import {
  listProjectsForUser,
  findProjectByIdForUser,
  getUserProfile,
  createProject,
  updateProjectSiteConfig,
  deleteProject,
  downloadProject,
} from './projects-service.js'
import { listProjectsQuerySchema, projectIdSchema } from './validation.js'
import { createProjectBodySchema, updateProjectBodySchema } from './site-config-schema.js'
import { getAllTemplates } from './template-registry.js'
import { createFeedbackSchema, updateFeedbackSchema, feedbackIdSchema } from './feedback-validation.js'
import { buildProject } from './build-service.js'
import { setDomainSchema } from './domain-validation.js'
import {
  verifyDns,
  writeDomainTask,
  readDomainResult,
  updateDomainStatus,
  getDnsInstructions,
} from './domain-service.js'
import { createFeedback, listFeedback, updateFeedback } from './feedback-service.js'
import { requireAdmin } from '../auth/middleware.js'
import type { AuthenticatedRequest } from '../auth/types.js'

/** Defensively extract user sub from req.user (guaranteed by requireAuth) */
function getUserId(req: AuthenticatedRequest): string {
  if (!req.user) throw new Error('requireAuth did not populate req.user')
  return req.user.sub
}

/** Key rate limiter by authenticated user ID (falls back to IP) */
function userKey(req: Request): string {
  return (req as AuthenticatedRequest).user?.sub ?? req.ip ?? 'unknown'
}

const createProjectLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 5,
  keyGenerator: userKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'too_many_requests' },
})

const updateProjectLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  keyGenerator: userKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'too_many_requests' },
})

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 20,
  keyGenerator: userKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'too_many_requests' },
})

const domainLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10,
  keyGenerator: userKey,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'too_many_requests' },
})

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

projectsRouter.get('/templates', (_req, res: Response) => {
  return res.json({ ok: true, data: getAllTemplates() })
})

// SSE: real-time project events
projectsRouter.get('/:id/events', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = projectIdSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_project_id' })

    const project = await findProjectByIdForUser(parsed.data.id, getUserId(req))
    if (!project) return res.status(404).json({ ok: false, error: 'project_not_found' })

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no') // Disable nginx buffering
    res.flushHeaders()

    // Send current status immediately
    res.write(`event: status\ndata: ${JSON.stringify({ status: project.status })}\n\n`)

    // Listen for changes
    const { onProjectEvent } = await import('./events.js')
    const unsubscribe = onProjectEvent(parsed.data.id, (event) => {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`)
    })

    // Heartbeat every 30s
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n')
    }, 30_000)

    // Max connection lifetime: 10 minutes (prevents ghost listeners)
    const maxLifetime = setTimeout(
      () => {
        cleanup()
        res.end()
      },
      10 * 60 * 1000,
    )

    const cleanup = () => {
      unsubscribe()
      clearInterval(heartbeat)
      clearTimeout(maxLifetime)
    }

    // Cleanup on disconnect
    req.on('close', () => {
      cleanup()
    })
  } catch (err) {
    console.error('[sse] error', err instanceof Error ? err.message : 'unknown')
    if (!res.headersSent) {
      return res.status(500).json({ ok: false, error: 'internal_error' })
    }
  }
})

// Public access check — used by the AccessGate component embedded in built sites.
// Allows any origin since custom domain sites call this from their own domain.
projectsRouter.get('/access/:subdomain', async (req: AuthenticatedRequest, res: Response) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin ?? '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  try {
    const subdomain = req.params.subdomain
    if (!subdomain) return res.json({ granted: false })

    const project = await prisma.project.findFirst({
      where: { subdomain, deletedAt: null },
      select: { id: true, status: true, userId: true, planTier: true, siteConfig: true },
    })

    if (!project) return res.json({ granted: false })

    // Check if requester is the owner — owner always sees real site
    if (req.user && req.user.sub === project.userId) {
      return res.json({ granted: true, reason: 'owner', siteUrl: config.frontendUrl })
    }

    // Coming Soon mode — show placeholder instead of the site
    const siteConfig = (project.siteConfig as Record<string, unknown>) ?? {}
    if (siteConfig.comingSoon === true) {
      const bizInfo = (siteConfig.businessInfo as Record<string, unknown>) ?? {}
      return res.json({
        granted: false,
        comingSoon: true,
        businessName: (bizInfo.name as string) ?? null,
      })
    }

    // Paid project with active subscription: public
    if (project.status === 'live' && project.planTier) {
      return res.json({ granted: true, reason: 'public' })
    }

    return res.json({
      granted: false,
      loginUrl: `${config.frontendUrl}/login`,
      signupUrl: `${config.frontendUrl}/login`,
    })
  } catch {
    // Fail closed — deny access on error
    return res.json({ granted: false })
  }
})

projectsRouter.post('/', requireAuth, createProjectLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createProjectBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_payload', issues: parsed.error.issues })
    }

    const project = await createProject(getUserId(req), parsed.data)
    return res.status(201).json({ ok: true, data: project })
  } catch (err) {
    console.error('[projects] create error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

projectsRouter.patch('/:id', requireAuth, updateProjectLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idParsed = projectIdSchema.safeParse(req.params)
    if (!idParsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_project_id' })
    }

    const bodyParsed = updateProjectBodySchema.safeParse(req.body)
    if (!bodyParsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_payload' })
    }

    const project = await updateProjectSiteConfig(idParsed.data.id, getUserId(req), bodyParsed.data)
    if (!project) {
      return res.status(404).json({ ok: false, error: 'project_not_found' })
    }

    return res.json({ ok: true, data: project })
  } catch (err) {
    console.error('[projects] update error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

projectsRouter.get('/:id/download', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = projectIdSchema.safeParse(req.params)
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_project_id' })
    }

    const project = await findProjectByIdForUser(parsed.data.id, getUserId(req))
    if (!project) {
      return res.status(404).json({ ok: false, error: 'project_not_found' })
    }

    // Download requires a paid subscription
    if (!project.planTier) {
      return res.status(403).json({ ok: false, error: 'subscription_required' })
    }

    const zipBuffer = await downloadProject(parsed.data.id, getUserId(req))
    if (!zipBuffer) {
      return res.status(404).json({ ok: false, error: 'project_not_found' })
    }

    const filename = `${project.subdomain ?? 'project'}.zip`
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.send(zipBuffer)
  } catch (err) {
    console.error('[projects] download error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// --- Feedback (content requests) ---

projectsRouter.post('/:id/feedback', requireAuth, feedbackLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idParsed = projectIdSchema.safeParse(req.params)
    if (!idParsed.success) return res.status(400).json({ ok: false, error: 'invalid_project_id' })

    // Verify project ownership
    const project = await findProjectByIdForUser(idParsed.data.id, getUserId(req))
    if (!project) return res.status(404).json({ ok: false, error: 'project_not_found' })

    const bodyParsed = createFeedbackSchema.safeParse(req.body)
    if (!bodyParsed.success)
      return res.status(400).json({ ok: false, error: 'invalid_payload', issues: bodyParsed.error.issues })

    const feedback = await createFeedback(idParsed.data.id, getUserId(req), bodyParsed.data)
    return res.status(201).json({ ok: true, data: feedback })
  } catch (err) {
    console.error('[feedback] create error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

projectsRouter.get('/:id/feedback', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idParsed = projectIdSchema.safeParse(req.params)
    if (!idParsed.success) return res.status(400).json({ ok: false, error: 'invalid_project_id' })

    const project = await findProjectByIdForUser(idParsed.data.id, getUserId(req))
    if (!project) return res.status(404).json({ ok: false, error: 'project_not_found' })

    const items = await listFeedback(idParsed.data.id, getUserId(req))
    return res.json({ ok: true, data: items })
  } catch (err) {
    console.error('[feedback] list error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// --- Feedback admin (operator) ---

export const feedbackRouter = Router()

feedbackRouter.patch('/:feedbackId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const idParsed = feedbackIdSchema.safeParse(req.params)
    if (!idParsed.success) return res.status(400).json({ ok: false, error: 'invalid_feedback_id' })

    const bodyParsed = updateFeedbackSchema.safeParse(req.body)
    if (!bodyParsed.success) return res.status(400).json({ ok: false, error: 'invalid_payload' })

    const updated = await updateFeedback(idParsed.data.feedbackId, bodyParsed.data)
    if (!updated) return res.status(404).json({ ok: false, error: 'feedback_not_found' })

    return res.json({ ok: true, data: updated })
  } catch (err) {
    console.error('[feedback] update error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// --- Delete ---

projectsRouter.delete('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = projectIdSchema.safeParse(req.params)
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_project_id' })
    }

    const deleted = await deleteProject(parsed.data.id, getUserId(req))
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'project_not_found' })
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('[projects] delete error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// Serve built preview — redirect bare /preview to /preview/
projectsRouter.get('/:id/preview', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  return res.redirect(`${req.originalUrl}/`)
})

// Serve built preview files — authenticated only (free tier = private preview)
// Handles both /preview/ (index.html) and /preview/assets/* (static files)
projectsRouter.get('/:id/preview/*', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const projectId = req.params.id
    const idParsed = projectIdSchema.safeParse({ id: projectId })
    if (!idParsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_project_id' })
    }

    const project = await findProjectByIdForUser(idParsed.data.id, getUserId(req))
    if (!project || !project.subdomain) {
      return res.status(404).json({ ok: false, error: 'project_not_found' })
    }

    // Extract the file path after /preview/
    const filePath = req.params[0] || 'index.html'
    const fullPath = path.join(config.sitesDir, project.subdomain, filePath)

    // Prevent directory traversal
    const sitePath = path.join(config.sitesDir, project.subdomain)
    if (!path.resolve(fullPath).startsWith(path.resolve(sitePath))) {
      return res.status(403).json({ ok: false, error: 'forbidden' })
    }

    return res.sendFile(fullPath, (err) => {
      if (err) {
        // If file not found, serve index.html (SPA fallback)
        res.sendFile(path.join(sitePath, 'index.html'), (err2) => {
          if (err2) {
            res.status(404).json({ ok: false, error: 'preview_not_found' })
          }
        })
      }
    })
  } catch (err) {
    console.error('[projects] preview error', err instanceof Error ? err.message : 'unknown')
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

// ============================================================================
// Custom Domain Management (Professional plan only)
// ============================================================================

projectsRouter.post('/:id/domain', requireAuth, domainLimiter, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = projectIdSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_project_id' })

    const userId = getUserId(req)
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.id, userId, deletedAt: null },
      select: { id: true, planTier: true, status: true, subdomain: true, domain: true },
    })
    if (!project) return res.status(404).json({ ok: false, error: 'project_not_found' })
    if (project.planTier !== 'professional')
      return res.status(403).json({ ok: false, error: 'professional_plan_required' })
    if (project.status !== 'live') return res.status(400).json({ ok: false, error: 'project_must_be_live' })

    const body = setDomainSchema.safeParse(req.body)
    if (!body.success)
      return res.status(400).json({ ok: false, error: 'invalid_domain', details: body.error.flatten() })

    const domain = body.data.domain

    // Check domain not claimed by another project
    const existing = await prisma.project.findFirst({
      where: { domain, deletedAt: null, id: { not: project.id } },
    })
    if (existing) return res.status(409).json({ ok: false, error: 'domain_already_claimed' })

    // If changing domain, clean up old one
    if (project.domain && project.domain !== domain) {
      await writeDomainTask('remove', project.domain, project.subdomain ?? project.id)
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { domain, domainStatus: 'pending', domainError: null },
    })

    return res.json({
      ok: true,
      data: { domain, domainStatus: 'pending', dnsInstructions: getDnsInstructions(domain) },
    })
  } catch (err) {
    console.error('[domain] set error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

projectsRouter.post(
  '/:id/domain/verify',
  requireAuth,
  domainLimiter,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const parsed = projectIdSchema.safeParse(req.params)
      if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_project_id' })

      const userId = getUserId(req)
      const project = await prisma.project.findFirst({
        where: { id: parsed.data.id, userId, deletedAt: null },
        select: { id: true, domain: true, domainStatus: true, subdomain: true },
      })
      if (!project) return res.status(404).json({ ok: false, error: 'project_not_found' })
      if (!project.domain) return res.status(400).json({ ok: false, error: 'no_domain_set' })

      const result = await verifyDns(project.domain)

      if (!result.verified) {
        return res.json({
          ok: true,
          data: {
            domain: project.domain,
            domainStatus: 'pending',
            verified: false,
            reason: result.reason,
            dnsInstructions: getDnsInstructions(project.domain),
          },
        })
      }

      // DNS verified — trigger provisioning
      await updateDomainStatus(project.id, 'dns_verified')
      await writeDomainTask('setup', project.domain, project.subdomain ?? project.id)
      await updateDomainStatus(project.id, 'ssl_provisioning')

      return res.json({
        ok: true,
        data: { domain: project.domain, domainStatus: 'ssl_provisioning', verified: true, method: result.method },
      })
    } catch (err) {
      console.error('[domain] verify error', err instanceof Error ? err.message : 'unknown')
      return res.status(500).json({ ok: false, error: 'internal_error' })
    }
  },
)

projectsRouter.get('/:id/domain/status', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = projectIdSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_project_id' })

    const userId = getUserId(req)
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.id, userId, deletedAt: null },
      select: { id: true, domain: true, domainStatus: true, domainError: true, subdomain: true },
    })
    if (!project) return res.status(404).json({ ok: false, error: 'project_not_found' })
    if (!project.domain) return res.json({ ok: true, data: { domain: null, domainStatus: null } })

    // If provisioning, check for result from host-side script
    if (project.domainStatus === 'ssl_provisioning') {
      const taskResult = await readDomainResult(project.domain)
      if (taskResult) {
        if (taskResult.success) {
          await updateDomainStatus(project.id, 'active')

          // Trigger the custom-domain build (--base=/)
          if (project.subdomain) {
            const repoPath = path.join(config.projectsDir, project.id)
            buildProject(repoPath, project.subdomain, '/').catch((err) =>
              console.error(`[domain] custom build failed for ${project.id}:`, err),
            )
          }

          return res.json({ ok: true, data: { domain: project.domain, domainStatus: 'active' } })
        } else {
          await updateDomainStatus(project.id, 'error', taskResult.error)
          return res.json({
            ok: true,
            data: { domain: project.domain, domainStatus: 'error', domainError: taskResult.error },
          })
        }
      }
    }

    return res.json({
      ok: true,
      data: { domain: project.domain, domainStatus: project.domainStatus, domainError: project.domainError },
    })
  } catch (err) {
    console.error('[domain] status error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

projectsRouter.delete('/:id/domain', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = projectIdSchema.safeParse(req.params)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_project_id' })

    const userId = getUserId(req)
    const project = await prisma.project.findFirst({
      where: { id: parsed.data.id, userId, deletedAt: null },
      select: { id: true, domain: true, subdomain: true },
    })
    if (!project) return res.status(404).json({ ok: false, error: 'project_not_found' })
    if (!project.domain) return res.json({ ok: true })

    await writeDomainTask('remove', project.domain, project.subdomain ?? project.id)
    await prisma.project.update({
      where: { id: project.id },
      data: { domain: null, domainStatus: null, domainError: null },
    })

    return res.json({ ok: true })
  } catch (err) {
    console.error('[domain] delete error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})
