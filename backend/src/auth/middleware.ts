import type { Response, NextFunction } from 'express'
import { verifyJwt } from './auth-service.js'
import type { AuthenticatedRequest } from './types.js'

/**
 * Parses JWT from cookie if present. Does NOT reject unauthenticated requests.
 * Use requireAuth or requireAdmin for protected routes.
 */
export function jwtMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined
  if (token) {
    const payload = verifyJwt(token)
    if (payload) {
      req.user = payload
    }
  }
  next()
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ ok: false, error: 'unauthorized' })
    return
  }
  next()
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ ok: false, error: 'unauthorized' })
    return
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ ok: false, error: 'forbidden' })
    return
  }
  next()
}
