import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  on: vi.fn(),
}

vi.mock('../src/redis.js', () => ({
  redis: mockRedis,
}))

vi.mock('../src/config.js', () => ({
  config: { redisUrl: 'redis://localhost:6379' },
}))

const mockPrisma = {
  user: {
    findFirst: vi.fn(),
  },
}

vi.mock('../src/db.js', () => ({
  prisma: mockPrisma,
}))

const { getSiteMode, setSiteMode, siteMaintenanceGuard } = await import('../src/site-mode.js')

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// getSiteMode
// ---------------------------------------------------------------------------

describe('getSiteMode', () => {
  it('returns "normal" when Redis key is not set', async () => {
    mockRedis.get.mockResolvedValue(null)
    expect(await getSiteMode()).toBe('normal')
  })

  it('returns "maintenance" when Redis has that value', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    expect(await getSiteMode()).toBe('maintenance')
  })

  it('returns "test" when Redis has that value', async () => {
    mockRedis.get.mockResolvedValue('test')
    expect(await getSiteMode()).toBe('test')
  })

  it('returns "normal" for unknown values', async () => {
    mockRedis.get.mockResolvedValue('garbage')
    expect(await getSiteMode()).toBe('normal')
  })
})

// ---------------------------------------------------------------------------
// setSiteMode
// ---------------------------------------------------------------------------

describe('setSiteMode', () => {
  it('writes the mode to Redis', async () => {
    mockRedis.set.mockResolvedValue('OK')
    await setSiteMode('maintenance')
    expect(mockRedis.set).toHaveBeenCalledWith('site:mode', 'maintenance')
  })
})

// ---------------------------------------------------------------------------
// siteMaintenanceGuard middleware
// ---------------------------------------------------------------------------

describe('siteMaintenanceGuard', () => {
  function mockReqRes(path: string, opts?: { userRole?: string; body?: Record<string, unknown> }) {
    const req = {
      path,
      body: opts?.body ?? {},
      user: opts?.userRole ? { sub: 'user-1', email: 'a@b.com', role: opts.userRole } : undefined,
    }
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    }
    const next = vi.fn()
    return { req, res, next }
  }

  it('passes through when mode is normal', async () => {
    mockRedis.get.mockResolvedValue('normal')
    const { req, res, next } = mockReqRes('/api/auth/magic-link')

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('blocks magic-link for non-admin email in maintenance mode', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    mockPrisma.user.findFirst.mockResolvedValue(null) // not an admin
    const { req, res, next } = mockReqRes('/api/auth/magic-link', { body: { email: 'user@example.com' } })

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(503)
    expect(res.json).toHaveBeenCalledWith({ ok: false, error: 'site_maintenance', mode: 'maintenance' })
  })

  it('allows magic-link for admin email in maintenance mode', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    mockPrisma.user.findFirst.mockResolvedValue({ id: 'admin-1' }) // is admin
    const { req, res, next } = mockReqRes('/api/auth/magic-link', { body: { email: 'admin@codebg.com' } })

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: 'admin@codebg.com', role: 'admin', deletedAt: null },
      select: { id: true },
    })
  })

  it('allows verify in maintenance mode (admin got magic link)', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    const { req, res, next } = mockReqRes('/api/auth/verify')

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(next).toHaveBeenCalled()
  })

  it('blocks checkout for non-admin in maintenance mode', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    const { req, res, next } = mockReqRes('/api/checkout/session', { userRole: 'client' })

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(res.status).toHaveBeenCalledWith(503)
  })

  it('blocks billing for non-admin in maintenance mode', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    const { req, res, next } = mockReqRes('/api/billing/portal', { userRole: 'client' })

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(res.status).toHaveBeenCalledWith(503)
  })

  it('allows authenticated admin through in maintenance mode', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    const { req, res, next } = mockReqRes('/api/checkout/session', { userRole: 'admin' })

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('allows authenticated admin through in test mode', async () => {
    mockRedis.get.mockResolvedValue('test')
    const { req, res, next } = mockReqRes('/api/checkout/session', { userRole: 'admin' })

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(next).toHaveBeenCalled()
  })

  it('allows non-gated paths in maintenance mode', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    const { req, res, next } = mockReqRes('/api/projects')

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(next).toHaveBeenCalled()
  })

  it('allows healthz in maintenance mode', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    const { req, res, next } = mockReqRes('/healthz')

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(next).toHaveBeenCalled()
  })

  it('allows /api/auth/me in maintenance mode (existing sessions)', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    const { req, res, next } = mockReqRes('/api/auth/me', { userRole: 'client' })

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(next).toHaveBeenCalled()
  })

  it('fails open if Redis errors', async () => {
    mockRedis.get.mockRejectedValue(new Error('Redis down'))
    const { req, res, next } = mockReqRes('/api/auth/magic-link')

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(next).toHaveBeenCalled()
  })

  it('blocks magic-link when no email in body', async () => {
    mockRedis.get.mockResolvedValue('maintenance')
    const { req, res, next } = mockReqRes('/api/auth/magic-link', { body: {} })

    await siteMaintenanceGuard(req as never, res as never, next)

    expect(res.status).toHaveBeenCalledWith(503)
  })
})
