import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing build-service
vi.mock('../src/config.js', () => ({
  config: { sitesDir: '/tmp/test-sites' },
}))
vi.mock('../src/projects/repo-service.js', () => ({
  ensureNodeModulesSymlink: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('node:child_process', () => ({
  execFile: vi.fn((_cmd: string, _args: string[], _opts: unknown, cb: (err: Error | null) => void) => {
    setTimeout(() => cb(null), 10)
    return {} as ReturnType<typeof import('node:child_process').execFile>
  }),
}))

import { buildProject, getBuildQueueStatus } from '../src/projects/build-service.js'

describe('build queue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns queue status', () => {
    const status = getBuildQueueStatus()
    expect(status.maxDepth).toBe(20)
    expect(status.queueDepth).toBeGreaterThanOrEqual(0)
    expect(typeof status.isBuilding).toBe('boolean')
  })

  it('builds successfully', async () => {
    const result = await buildProject('/tmp/repo', 'test-site')
    expect(result.status).toBe('success')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('builds with custom base for custom domains', async () => {
    const result = await buildProject('/tmp/repo', 'test-site', '/')
    expect(result.status).toBe('success')
  })
})
