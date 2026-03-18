import { describe, expect, it, vi } from 'vitest'
import type { Response, NextFunction } from 'express'
import type { AuthenticatedRequest } from '../src/auth/types.js'

// Mock config and db
const TEST_SECRET = 'test-secret-key-that-is-long-enough-for-hmac-256'
vi.mock('../src/config.js', () => ({
  config: {
    jwtSecret: TEST_SECRET,
    jwtExpiresIn: '1h',
    magicLinkExpiryMinutes: 15,
    resendApiKey: 'test',
    mailFrom: 'test@test.com',
    frontendUrl: 'http://localhost:3000',
  },
}))
vi.mock('../src/db.js', () => ({ prisma: {} }))

const { signJwt } = await import('../src/auth/auth-service.js')
const { jwtMiddleware, requireAuth, requireAdmin } = await import('../src/auth/middleware.js')

function mockReq(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return { cookies: {}, ...overrides } as AuthenticatedRequest
}

function mockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  }
  return res as unknown as Response
}

describe('jwtMiddleware', () => {
  it('sets req.user when valid token cookie is present', () => {
    const token = signJwt({ sub: 'u1', email: 'a@b.com', role: 'client' })
    const req = mockReq({ cookies: { token } })
    const next = vi.fn()

    jwtMiddleware(req, mockRes(), next)

    expect(req.user).toBeDefined()
    expect(req.user!.sub).toBe('u1')
    expect(next).toHaveBeenCalledOnce()
  })

  it('does not set req.user when no cookie', () => {
    const req = mockReq()
    const next = vi.fn()

    jwtMiddleware(req, mockRes(), next)

    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalledOnce()
  })

  it('does not set req.user when cookie has invalid token', () => {
    const req = mockReq({ cookies: { token: 'garbage' } })
    const next = vi.fn()

    jwtMiddleware(req, mockRes(), next)

    expect(req.user).toBeUndefined()
    expect(next).toHaveBeenCalledOnce()
  })

  it('always calls next()', () => {
    const next = vi.fn()
    jwtMiddleware(mockReq(), mockRes(), next)
    expect(next).toHaveBeenCalledOnce()
  })
})

describe('requireAuth', () => {
  it('calls next when req.user is set', () => {
    const req = mockReq()
    req.user = { sub: 'u1', email: 'a@b.com', role: 'client' }
    const res = mockRes()
    const next = vi.fn()

    requireAuth(req, res, next)

    expect(next).toHaveBeenCalledOnce()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('returns 401 when req.user is not set', () => {
    const req = mockReq()
    const res = mockRes()
    const next = vi.fn()

    requireAuth(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'unauthorized' })
    expect(next).not.toHaveBeenCalled()
  })
})

describe('requireAdmin', () => {
  it('calls next when user is admin', () => {
    const req = mockReq()
    req.user = { sub: 'u1', email: 'a@b.com', role: 'admin' }
    const res = mockRes()
    const next = vi.fn()

    requireAdmin(req, res, next)

    expect(next).toHaveBeenCalledOnce()
  })

  it('returns 401 when no user', () => {
    const req = mockReq()
    const res = mockRes()
    const next = vi.fn()

    requireAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 403 when user is not admin', () => {
    const req = mockReq()
    req.user = { sub: 'u1', email: 'a@b.com', role: 'client' }
    const res = mockRes()
    const next = vi.fn()

    requireAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'forbidden' })
    expect(next).not.toHaveBeenCalled()
  })

  it('returns 403 for lead role', () => {
    const req = mockReq()
    req.user = { sub: 'u1', email: 'a@b.com', role: 'lead' }
    const res = mockRes()
    const next = vi.fn()

    requireAdmin(req, res, next)

    expect(res.status).toHaveBeenCalledWith(403)
    expect(next).not.toHaveBeenCalled()
  })
})
