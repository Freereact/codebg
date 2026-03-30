import type { RequestHandler } from 'express'
import { z } from 'zod'
import { redis } from './redis.js'
import { prisma } from './db.js'
import type { AuthenticatedRequest } from './auth/types.js'

export type SiteMode = 'normal' | 'maintenance' | 'test'

const REDIS_KEY = 'site:mode'

export const setSiteModeSchema = z.object({
  mode: z.enum(['normal', 'maintenance', 'test']),
})

export async function getSiteMode(): Promise<SiteMode> {
  const value = await redis.get(REDIS_KEY)
  if (value === 'maintenance' || value === 'test') return value
  return 'normal'
}

export async function setSiteMode(mode: SiteMode): Promise<void> {
  await redis.set(REDIS_KEY, mode)
  console.log(`[site-mode] set to: ${mode}`)
}

/** Paths blocked in maintenance/test mode for non-admins */
const GATED_PREFIXES = ['/api/auth/magic-link', '/api/auth/verify', '/api/checkout', '/api/billing']

/** Check if an email belongs to an admin user */
async function isAdminEmail(email: string): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: { email, role: 'admin', deletedAt: null },
    select: { id: true },
  })
  return user !== null
}

/**
 * Express middleware that blocks non-admin access to gated endpoints
 * when site is in maintenance or test mode.
 * Admin auth flow (magic-link + verify) is always allowed through.
 */
export const siteMaintenanceGuard: RequestHandler = async (req, res, next) => {
  try {
    const mode = await getSiteMode()
    if (mode === 'normal') return next()

    // Already-authenticated admins always pass through
    const user = (req as AuthenticatedRequest).user
    if (user?.role === 'admin') return next()

    // Only block specific paths
    const blocked = GATED_PREFIXES.some((prefix) => req.path.startsWith(prefix))
    if (!blocked) return next()

    // Allow admin auth flow: magic-link requests with admin email
    if (req.path === '/api/auth/magic-link') {
      const email = (req.body as Record<string, unknown>)?.email
      if (typeof email === 'string' && (await isAdminEmail(email))) return next()
    }

    // Allow admin auth flow: verify tokens belonging to admin users
    if (req.path === '/api/auth/verify') {
      // Let the verify endpoint handle it — the token will resolve to an admin user.
      // We can't check the token here without duplicating auth logic, so we allow
      // all verify requests through. The magic-link gate above ensures only admins
      // can get a token in the first place.
      return next()
    }

    return res.status(503).json({ ok: false, error: 'site_maintenance', mode })
  } catch {
    // If Redis is down, fail open — don't break the site
    return next()
  }
}
