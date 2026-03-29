import { Router } from 'express'
import type { Request, Response } from 'express'
import rateLimit from 'express-rate-limit'
import { magicLinkSchema, verifyTokenSchema } from './validation.js'
import { findOrCreateUser, createAndSendMagicLink, verifyMagicLinkToken, signJwt } from './auth-service.js'
import { requireAuth } from './middleware.js'
import type { AuthenticatedRequest } from './types.js'

const magicLinkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'too_many_requests' },
})

const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'too_many_requests' },
})

export const authRouter = Router()

authRouter.post('/magic-link', magicLinkLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = magicLinkSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_email', issues: parsed.error.issues })
    }

    const user = await findOrCreateUser(parsed.data.email)
    await createAndSendMagicLink(user.id, user.email)

    return res.json({ ok: true })
  } catch (err) {
    console.error('[auth] magic-link error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

authRouter.post('/verify', verifyLimiter, async (req: Request, res: Response) => {
  try {
    const parsed = verifyTokenSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ ok: false, error: 'invalid_token' })
    }

    const result = await verifyMagicLinkToken(parsed.data.token)
    if (!result) {
      return res.status(401).json({ ok: false, error: 'token_invalid_or_expired' })
    }

    const sessionToken = signJwt({ sub: result.userId, email: result.email, role: result.role })

    res.cookie('token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    })

    return res.json({ ok: true, user: { id: result.userId, email: result.email, role: result.role } })
  } catch (err) {
    console.error('[auth] verify error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

authRouter.get('/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user
  return res.json({ ok: true, user: { id: user?.sub, email: user?.email, role: user?.role } })
})

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', { httpOnly: true, secure: true, sameSite: 'lax', path: '/' })
  return res.json({ ok: true })
})
