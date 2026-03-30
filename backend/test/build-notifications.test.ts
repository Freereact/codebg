import { describe, expect, it, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  project: {
    count: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  user: {
    findFirst: vi.fn(),
  },
}

vi.mock('../src/db.js', () => ({ prisma: mockPrisma }))

vi.mock('../src/config.js', () => ({
  config: {
    projectsDir: '/tmp/test-projects',
    sitesDir: '/tmp/test-sites',
    sampleAppsDir: '/tmp/test-sample-apps',
    buildRateLimitSeconds: 300,
    frontendUrl: 'https://codebg.com',
    resendApiKey: 'test',
    mailFrom: 'noreply@codebg.com',
    mailTo: 'admin@codebg.com',
  },
}))

vi.mock('../src/projects/repo-service.js', () => ({
  initProjectRepo: vi.fn().mockResolvedValue({ repoPath: '/tmp/test-projects/test', commitHash: 'abc123' }),
  updateOverrides: vi.fn().mockResolvedValue({ commitHash: 'def456' }),
  getVerifiedRepoPath: vi.fn().mockResolvedValue('/tmp/test-projects/test'),
  ensureNodeModulesSymlink: vi.fn().mockResolvedValue(undefined),
}))

const mockBuildProject = vi.fn()
vi.mock('../src/projects/build-service.js', () => ({
  buildProject: (...args: unknown[]) => mockBuildProject(...args),
}))

vi.mock('../src/projects/git-service.js', () => ({
  createArchive: vi.fn().mockResolvedValue(Buffer.from('zipdata')),
}))

vi.mock('../src/projects/events.js', () => ({
  emitProjectEvent: vi.fn(),
}))

vi.mock('../src/github/index.js', () => ({
  createGitHubRepo: vi
    .fn()
    .mockResolvedValue({ cloneUrl: 'https://github.com/org/test.git', htmlUrl: 'https://github.com/org/test' }),
  pushToGitHub: vi.fn().mockResolvedValue(undefined),
}))

const mockNotifyAdminBuildFailed = vi.fn().mockResolvedValue(undefined)
vi.mock('../src/admin/notifications.js', () => ({
  notifyAdminBuildFailed: (...args: unknown[]) => mockNotifyAdminBuildFailed(...args),
}))

const mockSubdomain = vi.fn().mockResolvedValue('test-site')
vi.mock('../src/projects/subdomain.js', () => ({
  generateUniqueSubdomain: (...args: unknown[]) => mockSubdomain(...args),
}))

const { createProject, updateProjectSiteConfig } = await import('../src/projects/projects-service.js')

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// createProject → runProjectBuild → notifyAdminBuildFailed
// ---------------------------------------------------------------------------

describe('build failure notifications via createProject', () => {
  const bizInfo = { name: 'Test Biz', phone: '555-1234', address: '123 Main St', hours: 'Mon-Fri 9-5' }

  it('calls notifyAdminBuildFailed when build result is not success', async () => {
    mockPrisma.project.create.mockResolvedValue({
      id: 'proj-1',
      userId: 'user-1',
      status: 'draft',
      domain: null,
      subdomain: 'test-site',
      templateSlug: 'bakery',
      planTier: null,
      siteConfig: {},
      setupFeeCents: null,
      paidAt: null,
      briefReceivedAt: null,
      draftReadyAt: null,
      launchedAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockPrisma.project.update.mockResolvedValue({})

    mockBuildProject.mockResolvedValue({ status: 'error', message: 'Vite build failed: syntax error' })

    await createProject('user-1', { templateSlug: 'bakery', businessInfo: bizInfo })

    // Build runs async (fire-and-forget), give it a tick
    await new Promise((r) => setTimeout(r, 50))

    expect(mockNotifyAdminBuildFailed).toHaveBeenCalledWith('test-site', 'Vite build failed: syntax error')
  })

  it('calls notifyAdminBuildFailed on pipeline exception', async () => {
    mockPrisma.project.create.mockResolvedValue({
      id: 'proj-1',
      userId: 'user-1',
      status: 'draft',
      domain: null,
      subdomain: 'test-site',
      templateSlug: 'bakery',
      planTier: null,
      siteConfig: {},
      setupFeeCents: null,
      paidAt: null,
      briefReceivedAt: null,
      draftReadyAt: null,
      launchedAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockPrisma.project.update.mockResolvedValue({})

    mockBuildProject.mockRejectedValue(new Error('ENOENT: no such file'))

    await createProject('user-1', { templateSlug: 'bakery', businessInfo: bizInfo })

    await new Promise((r) => setTimeout(r, 50))

    expect(mockNotifyAdminBuildFailed).toHaveBeenCalledWith('test-site', 'ENOENT: no such file')
  })

  it('does NOT call notifyAdminBuildFailed on successful build', async () => {
    mockPrisma.project.create.mockResolvedValue({
      id: 'proj-1',
      userId: 'user-1',
      status: 'draft',
      domain: null,
      subdomain: 'test-site',
      templateSlug: 'bakery',
      planTier: null,
      siteConfig: {},
      setupFeeCents: null,
      paidAt: null,
      briefReceivedAt: null,
      draftReadyAt: null,
      launchedAt: null,
      cancelledAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    mockPrisma.project.update.mockResolvedValue({})

    mockBuildProject.mockResolvedValue({ status: 'success', durationMs: 100 })

    await createProject('user-1', { templateSlug: 'bakery', businessInfo: bizInfo })

    await new Promise((r) => setTimeout(r, 50))

    expect(mockNotifyAdminBuildFailed).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// updateProjectSiteConfig → rebuild → notifyAdminBuildFailed
// ---------------------------------------------------------------------------

describe('build failure notifications via updateProjectSiteConfig', () => {
  it('calls notifyAdminBuildFailed when rebuild fails', async () => {
    const now = new Date()
    mockPrisma.project.findFirst.mockResolvedValue({
      id: 'proj-1',
      userId: 'user-1',
      status: 'preview',
      domain: null,
      subdomain: 'my-shop',
      templateSlug: 'bakery',
      planTier: null,
      siteConfig: {
        templateSlug: 'bakery',
        businessInfo: { name: 'Old Name', phone: '555-1234', address: '123 Main St', hours: 'Mon-Fri 9-5' },
      },
      setupFeeCents: null,
      paidAt: null,
      briefReceivedAt: null,
      draftReadyAt: null,
      launchedAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    })
    mockPrisma.project.update.mockResolvedValue({
      id: 'proj-1',
      userId: 'user-1',
      status: 'preview',
      domain: null,
      subdomain: 'my-shop',
      templateSlug: 'bakery',
      planTier: null,
      siteConfig: {},
      setupFeeCents: null,
      paidAt: null,
      briefReceivedAt: null,
      draftReadyAt: null,
      launchedAt: null,
      cancelledAt: null,
      createdAt: now,
      updatedAt: now,
    })

    mockBuildProject.mockResolvedValue({ status: 'error', message: 'CSS compile error' })

    await updateProjectSiteConfig('proj-1', 'user-1', {
      businessInfo: { name: 'New Name', phone: '555-1234', address: '123 Main St', hours: 'Mon-Fri 9-5' },
    })

    // Rebuild is async
    await new Promise((r) => setTimeout(r, 50))

    expect(mockNotifyAdminBuildFailed).toHaveBeenCalledWith('my-shop', 'CSS compile error')
  })
})
