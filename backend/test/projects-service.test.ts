import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock prisma before importing service
const mockPrisma = {
  project: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
  },
}

vi.mock('../src/db.js', () => ({
  prisma: mockPrisma,
}))

vi.mock('../src/config.js', () => ({
  config: {
    projectsDir: '/tmp/test-projects',
    sitesDir: '/tmp/test-sites',
    sampleAppsDir: '/tmp/test-sample-apps',
    buildRateLimitSeconds: 300,
  },
}))

vi.mock('../src/projects/repo-service.js', () => ({
  initProjectRepo: vi.fn().mockResolvedValue({ repoPath: '/tmp/test-projects/test', commitHash: 'abc123' }),
  updateOverrides: vi.fn().mockResolvedValue({ commitHash: 'def456' }),
  getVerifiedRepoPath: vi.fn().mockResolvedValue('/tmp/test-projects/test'),
  ensureNodeModulesSymlink: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../src/projects/build-service.js', () => ({
  buildProject: vi.fn().mockResolvedValue({ status: 'success', durationMs: 100 }),
}))

vi.mock('../src/projects/git-service.js', () => ({
  createArchive: vi.fn().mockResolvedValue(Buffer.from('zipdata')),
}))

const { listProjectsForUser, findProjectByIdForUser, getUserProfile } =
  await import('../src/projects/projects-service.js')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('listProjectsForUser', () => {
  it('returns empty array when user has no projects', async () => {
    mockPrisma.project.count.mockResolvedValue(0)
    mockPrisma.project.findMany.mockResolvedValue([])

    const result = await listProjectsForUser('user-1', 20, 0)

    expect(result.projects).toEqual([])
    expect(result.total).toBe(0)
  })

  it('passes userId and deletedAt filter to Prisma', async () => {
    mockPrisma.project.count.mockResolvedValue(0)
    mockPrisma.project.findMany.mockResolvedValue([])

    await listProjectsForUser('user-123', 20, 0)

    expect(mockPrisma.project.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-123',
          deletedAt: null,
        }),
      }),
    )
  })

  it('passes limit and offset to Prisma', async () => {
    mockPrisma.project.count.mockResolvedValue(0)
    mockPrisma.project.findMany.mockResolvedValue([])

    await listProjectsForUser('user-1', 10, 5)

    expect(mockPrisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 10,
        skip: 5,
      }),
    )
  })

  it('maps Prisma rows to ProjectListItem with statusLabel', async () => {
    const now = new Date()
    mockPrisma.project.count.mockResolvedValue(1)
    mockPrisma.project.findMany.mockResolvedValue([
      {
        id: 'p1',
        status: 'live',
        domain: 'example.com',
        subdomain: 'example',
        templateSlug: 'bakery',
        planTier: 'starter',
        createdAt: now,
        updatedAt: now,
      },
    ])

    const result = await listProjectsForUser('user-1', 20, 0)

    expect(result.projects).toHaveLength(1)
    expect(result.projects[0]).toEqual({
      id: 'p1',
      status: 'live',
      statusLabel: 'Live',
      domain: 'example.com',
      subdomain: 'example',
      templateSlug: 'bakery',
      planTier: 'starter',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
  })

  it('provides fallback statusLabel for unknown status', async () => {
    const now = new Date()
    mockPrisma.project.count.mockResolvedValue(1)
    mockPrisma.project.findMany.mockResolvedValue([
      {
        id: 'p1',
        status: 'unknown_status',
        domain: null,
        subdomain: null,
        templateSlug: null,
        planTier: null,
        createdAt: now,
        updatedAt: now,
      },
    ])

    const result = await listProjectsForUser('user-1', 20, 0)
    expect(result.projects[0].statusLabel).toBe('unknown_status')
  })
})

describe('findProjectByIdForUser', () => {
  it('returns null when project not found', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null)

    const result = await findProjectByIdForUser('p1', 'user-1')
    expect(result).toBeNull()
  })

  it('enforces ownership via userId in WHERE clause', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null)

    await findProjectByIdForUser('p1', 'user-1')

    expect(mockPrisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'p1',
          userId: 'user-1',
          deletedAt: null,
        }),
      }),
    )
  })

  it('maps found project to ProjectDetail', async () => {
    const now = new Date()
    mockPrisma.project.findFirst.mockResolvedValue({
      id: 'p1',
      status: 'paid',
      domain: null,
      subdomain: 'test',
      templateSlug: 'dental',
      planTier: 'professional',
      siteConfig: { theme: 'blue' },
      setupFeeCents: 4900,
      paidAt: now,
      briefReceivedAt: null,
      draftReadyAt: null,
      launchedAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    })

    const result = await findProjectByIdForUser('p1', 'user-1')

    expect(result).not.toBeNull()
    expect(result!.id).toBe('p1')
    expect(result!.statusLabel).toBe('Payment received')
    expect(result!.siteConfig).toEqual({ theme: 'blue' })
    expect(result!.setupFeeCents).toBe(4900)
  })
})

describe('getUserProfile', () => {
  it('returns null when user not found', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)

    const result = await getUserProfile('user-1')
    expect(result).toBeNull()
  })

  it('returns profile with correct shape', async () => {
    const now = new Date()
    mockPrisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      email: 'a@b.com',
      name: 'Alex',
      phone: '555-1234',
      role: 'client',
      createdAt: now,
    })

    const result = await getUserProfile('user-1')

    expect(result).toEqual({
      id: 'user-1',
      email: 'a@b.com',
      name: 'Alex',
      phone: '555-1234',
      role: 'client',
      createdAt: now.toISOString(),
    })
  })

  it('filters by deletedAt: null', async () => {
    mockPrisma.user.findFirst.mockResolvedValue(null)

    await getUserProfile('user-1')

    expect(mockPrisma.user.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'user-1',
          deletedAt: null,
        }),
      }),
    )
  })
})
