import { describe, expect, it, vi, beforeEach } from 'vitest'
import path from 'node:path'

// Mock dependencies
const mockFs = {
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(''),
  cp: vi.fn().mockResolvedValue(undefined),
  symlink: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockRejectedValue(new Error('ENOENT')),
  readdir: vi.fn().mockResolvedValue([]),
}
vi.mock('node:fs/promises', () => ({ default: mockFs, ...mockFs }))

const mockGit = {
  initRepo: vi.fn().mockResolvedValue('abc123'),
  commitFiles: vi.fn().mockResolvedValue('def456'),
}
vi.mock('../src/projects/git-service.js', () => mockGit)

vi.mock('../src/config.js', () => ({
  config: {
    projectsDir: '/var/www/projects',
    sitesDir: '/var/www/sites',
    sampleAppsDir: '/mnt/sample-apps',
  },
}))

const mockPrisma = {
  project: {
    findFirst: vi.fn(),
  },
}
vi.mock('../src/db.js', () => ({ prisma: mockPrisma }))

const { getVerifiedRepoPath, initProjectRepo, updateOverrides } = await import('../src/projects/repo-service.js')

beforeEach(() => {
  vi.clearAllMocks()
  mockFs.access.mockRejectedValue(new Error('ENOENT'))
  mockFs.readFile.mockResolvedValue(
    `import type { CustomerConfig } from '../../types'\nimport heroImage from './assets/hero.jpg'\n\nexport const config: CustomerConfig = {\n  name: 'Test',\n  hero: { image: heroImage },\n  sections: [],\n}`,
  )
  mockFs.readdir.mockResolvedValue([{ name: 'hero.jpg', isFile: () => true, isDirectory: () => false }])
})

describe('getVerifiedRepoPath', () => {
  it('returns path for project owned by user', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'p-1', subdomain: 'test' })
    const result = await getVerifiedRepoPath('p-1', 'user-1')
    expect(result).toBe('/var/www/projects/p-1')
  })

  it('throws for project not found', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null)
    await expect(getVerifiedRepoPath('p-1', 'user-1')).rejects.toThrow()
  })

  it('throws for project owned by different user', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null) // WHERE userId filter excludes it
    await expect(getVerifiedRepoPath('p-1', 'wrong-user')).rejects.toThrow()
  })

  it('queries with userId and deletedAt:null', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'p-1' })
    await getVerifiedRepoPath('p-1', 'user-1')
    expect(mockPrisma.project.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'p-1',
          userId: 'user-1',
          deletedAt: null,
        }),
      }),
    )
  })

  it('uses DB-returned id for path (not input)', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'db-returned-id' })
    const result = await getVerifiedRepoPath('any-input', 'user-1')
    expect(result).toBe('/var/www/projects/db-returned-id')
  })

  it('validates path starts with projectsDir', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: '../etc' })
    await expect(getVerifiedRepoPath('../etc', 'user-1')).rejects.toThrow()
  })
})

describe('initProjectRepo', () => {
  const params = {
    projectId: 'p-1',
    templateSlug: 'bakery' as const,
    subdomain: 'sunrise-bakery',
    businessInfo: {
      name: 'Sunrise Bakery',
      phone: '(250) 555-0366',
      address: 'Penticton, BC',
      hours: 'Mon-Sat 7am-5pm',
    },
  }

  it('creates the project directory', async () => {
    await initProjectRepo(params)
    expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('p-1'), { recursive: true })
  })

  it('writes overrides.json as pure data (no code)', async () => {
    await initProjectRepo(params)
    const overridesCall = mockFs.writeFile.mock.calls.find((c: string[]) => c[0].endsWith('overrides.json'))
    expect(overridesCall).toBeDefined()
    const data = JSON.parse(overridesCall[1] as string)
    expect(data.name).toBe('Sunrise Bakery')
  })

  it('overrides.json is safe from code injection', async () => {
    await initProjectRepo({
      ...params,
      businessInfo: { ...params.businessInfo, name: "'; require('child_process')//" },
    })
    const overridesCall = mockFs.writeFile.mock.calls.find((c: string[]) => c[0].endsWith('overrides.json'))
    const raw = overridesCall[1] as string
    JSON.parse(raw) // Must be valid JSON
  })

  it('generates config.ts that does NOT contain user business info', async () => {
    await initProjectRepo(params)
    const configCall = mockFs.writeFile.mock.calls.find(
      (c: string[]) => c[0].endsWith('site/config.ts') || c[0].endsWith('site\\config.ts'),
    )
    expect(configCall).toBeDefined()
    const content = configCall[1] as string
    expect(content).not.toContain('Sunrise Bakery')
    expect(content).not.toContain('(250) 555-0366')
    expect(content).toContain('overrides.json')
  })

  it('writes .gitignore, README, package.json, vite.config.ts', async () => {
    await initProjectRepo(params)
    const files = mockFs.writeFile.mock.calls.map((c: string[]) => path.basename(c[0]))
    expect(files).toContain('.gitignore')
    expect(files).toContain('README.md')
    expect(files).toContain('package.json')
    expect(files).toContain('vite.config.ts')
  })

  it('calls git init after all files written', async () => {
    await initProjectRepo(params)
    expect(mockGit.initRepo).toHaveBeenCalledWith(expect.stringContaining('p-1'), expect.stringContaining('bakery'))
  })

  it('returns commit hash', async () => {
    const result = await initProjectRepo(params)
    expect(result.commitHash).toBe('abc123')
  })
})

describe('updateOverrides', () => {
  it('writes new overrides.json and creates git commit', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'p-1', subdomain: 'test' })
    mockFs.readFile.mockResolvedValue('{"name":"Old Name"}')

    await updateOverrides('p-1', 'user-1', { name: 'New Name', phone: '555', address: 'Addr', hours: '9-5' })

    // Should write overrides.json
    const writeCall = mockFs.writeFile.mock.calls.find((c: string[]) => c[0].endsWith('overrides.json'))
    expect(writeCall).toBeDefined()
    const data = JSON.parse(writeCall[1] as string)
    expect(data.name).toBe('New Name')

    // Should commit
    expect(mockGit.commitFiles).toHaveBeenCalledWith(
      expect.stringContaining('p-1'),
      expect.arrayContaining(['src/site/overrides.json']),
      expect.any(String),
    )
  })
})
