import path from 'node:path'
import { Router } from 'express'
import type { Request, Response } from 'express'
import { verifyWebhookSignature, pullFromGitHub } from './github-service.js'
import { buildProject } from '../projects/build-service.js'
import { prisma } from '../db.js'
import { config } from '../config.js'
import { notifyUserPreviewReady } from '../admin/notifications.js'

export const githubWebhookRouter = Router()

// Parse raw body for signature verification
githubWebhookRouter.post('/github', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature-256'] as string | undefined
    const event = req.headers['x-github-event'] as string | undefined

    if (!signature || !event) {
      return res.status(400).json({ ok: false, error: 'missing_headers' })
    }

    // Verify webhook signature against raw bytes (not re-serialized JSON)
    const rawBody = req.body as Buffer
    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(401).json({ ok: false, error: 'invalid_signature' })
    }

    // Parse the raw body after verification
    const payload = JSON.parse(rawBody.toString('utf-8')) as Record<string, unknown>

    // Only handle push events
    if (event !== 'push') {
      return res.json({ ok: true, skipped: true })
    }

    const repo = payload.repository as Record<string, unknown> | undefined
    const repoName = repo?.name as string | undefined
    if (!repoName) {
      return res.status(400).json({ ok: false, error: 'missing_repo_name' })
    }

    // Find project by subdomain (repo name = subdomain)
    const project = await prisma.project.findFirst({
      where: { subdomain: repoName, deletedAt: null },
      include: { user: { select: { email: true, name: true } } },
    })

    if (!project) {
      return res.json({ ok: true, skipped: true, reason: 'no_matching_project' })
    }

    console.log(`[webhook] push received for project ${project.id} (${repoName})`)

    // Pull latest from GitHub
    const repoPath = path.join(config.projectsDir, project.id)
    await pullFromGitHub(repoPath)
    console.log(`[webhook] pulled latest for ${project.id}`)

    // Update status and rebuild
    await prisma.project.update({ where: { id: project.id }, data: { status: 'building' } })

    const result = await buildProject(repoPath, project.subdomain ?? repoName)

    if (result.status === 'success') {
      await prisma.project.update({
        where: { id: project.id },
        data: { status: 'preview', draftReadyAt: new Date() },
      })
      console.log(`[webhook] rebuild success for ${project.id} (${result.durationMs}ms)`)

      // Notify user
      notifyUserPreviewReady(
        project.user.email,
        project.user.name,
        project.subdomain ?? repoName,
        project.subdomain ?? repoName,
        project.id,
      ).catch(() => {})

      // Auto-complete feedback referenced in commit messages
      const commits = (payload.commits ?? []) as Array<{ message: string }>
      await autoCompleteFeedback(project.id, commits)
    } else {
      await prisma.project.update({ where: { id: project.id }, data: { status: 'draft' } })
      console.error(`[webhook] rebuild failed for ${project.id}: ${result.message}`)
    }

    return res.json({ ok: true, projectId: project.id, buildStatus: result.status })
  } catch (err) {
    console.error('[webhook] error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

/**
 * Parse commit messages for feedback IDs and auto-complete them.
 * Format: "Fix #<uuid>" or "Addresses <uuid>" or "feedback:<uuid>"
 */
async function autoCompleteFeedback(projectId: string, commits: Array<{ message: string }>): Promise<void> {
  const uuidPattern =
    /(?:fix|fixes|addresses|feedback[: ])\s*#?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/gi

  const feedbackIds = new Set<string>()
  for (const commit of commits) {
    let match: RegExpExecArray | null
    while ((match = uuidPattern.exec(commit.message)) !== null) {
      feedbackIds.add(match[1].toLowerCase())
    }
  }

  if (feedbackIds.size === 0) return

  for (const feedbackId of feedbackIds) {
    try {
      await prisma.contentRequest.update({
        where: { id: feedbackId, projectId },
        data: { status: 'completed', adminResponse: 'Addressed in latest update', completedAt: new Date() },
      })
      console.log(`[webhook] auto-completed feedback ${feedbackId}`)
    } catch {
      // Feedback ID might not exist or not belong to this project
    }
  }
}
