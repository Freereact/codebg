import { describe, expect, it, vi, beforeEach } from 'vitest'

const mockFs = {
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
  copyFile: vi.fn().mockResolvedValue(undefined),
  access: vi.fn().mockRejectedValue(new Error('ENOENT')),
}

vi.mock('node:fs/promises', () => ({ default: mockFs, ...mockFs }))

vi.mock('../src/config.js', () => ({
  config: {
    projectsDir: '/var/www/projects',
    sampleAppsDir: '/home/user/sample-apps',
  },
}))

const { createWorkspace, getWorkspacePath } = await import('../src/projects/workspace-service.js')

beforeEach(() => {
  vi.clearAllMocks()
  mockFs.access.mockRejectedValue(new Error('ENOENT'))
})

describe('getWorkspacePath', () => {
  it('returns correct path', () => {
    expect(getWorkspacePath('abc-123')).toBe('/var/www/projects/abc-123')
  })
})

describe('createWorkspace', () => {
  const input = {
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

  it('creates the workspace directory', async () => {
    await createWorkspace(input)
    expect(mockFs.mkdir).toHaveBeenCalledWith('/var/www/projects/p-1', { recursive: true })
  })

  it('writes config.ts with business info', async () => {
    await createWorkspace(input)
    const configCall = mockFs.writeFile.mock.calls.find((c: string[]) => c[0].endsWith('config.ts'))
    expect(configCall).toBeDefined()
    const content = configCall[1] as string
    expect(content).toContain('Sunrise Bakery')
    expect(content).toContain('(250) 555-0366')
    expect(content).toContain('Penticton, BC')
  })

  it('writes theme.css', async () => {
    await createWorkspace(input)
    const themeCall = mockFs.writeFile.mock.calls.find((c: string[]) => c[0].endsWith('theme.css'))
    expect(themeCall).toBeDefined()
  })

  it('writes meta.json with slug and projectId', async () => {
    await createWorkspace(input)
    const metaCall = mockFs.writeFile.mock.calls.find((c: string[]) => c[0].endsWith('meta.json'))
    expect(metaCall).toBeDefined()
    const meta = JSON.parse(metaCall[1] as string)
    expect(meta.slug).toBe('sunrise-bakery')
    expect(meta.projectId).toBe('p-1')
  })

  it('creates assets directory', async () => {
    await createWorkspace(input)
    const assetsCall = mockFs.mkdir.mock.calls.find((c: string[]) => c[0].includes('assets'))
    expect(assetsCall).toBeDefined()
  })
})
