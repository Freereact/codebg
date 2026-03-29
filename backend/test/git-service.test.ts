import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock child_process.execFile
const mockExecFile = vi.fn()
vi.mock('node:child_process', () => ({
  execFile: (...args: unknown[]) => {
    // Find the callback (last function arg)
    const cb = args.find((a) => typeof a === 'function') as
      | ((err: Error | null, stdout: string, stderr: string) => void)
      | undefined
    const result = mockExecFile(...args)
    if (cb && result === undefined) {
      cb(null, '', '')
    }
    return undefined
  },
}))

vi.mock('node:util', async () => {
  const actual = await vi.importActual<typeof import('node:util')>('node:util')
  return {
    ...actual,
    promisify: (fn: unknown) => {
      // Return a function that calls mockExecFile and returns a promise
      return async (...args: unknown[]) => {
        return mockExecFile(...args)
      }
    },
  }
})

const { initRepo, commitFiles, createArchive, getHistory } = await import('../src/projects/git-service.js')

beforeEach(() => {
  vi.clearAllMocks()
  mockExecFile.mockResolvedValue({ stdout: 'abc123\n', stderr: '' })
})

describe('initRepo', () => {
  it('calls git init, git add, and git commit in sequence', async () => {
    await initRepo('/tmp/test-repo', 'Initial commit')

    const calls = mockExecFile.mock.calls
    expect(calls.length).toBe(4) // init, add, commit, rev-parse

    expect(calls[0][0]).toBe('git')
    expect(calls[0][1]).toContain('init')

    expect(calls[1][0]).toBe('git')
    expect(calls[1][1]).toContain('add')

    expect(calls[2][0]).toBe('git')
    expect(calls[2][1]).toContain('commit')

    expect(calls[3][0]).toBe('git')
    expect(calls[3][1]).toContain('rev-parse')
  })

  it('uses execFile (not exec) for shell safety', async () => {
    await initRepo('/tmp/test', 'msg')
    // All calls should be to 'git' binary, not a shell string
    for (const call of mockExecFile.mock.calls) {
      expect(call[0]).toBe('git')
      expect(Array.isArray(call[1])).toBe(true)
    }
  })

  it('sets cwd to the repo path', async () => {
    await initRepo('/var/www/projects/abc', 'init')
    for (const call of mockExecFile.mock.calls) {
      expect(call[2]?.cwd).toBe('/var/www/projects/abc')
    }
  })

  it('returns trimmed commit hash', async () => {
    mockExecFile.mockResolvedValue({ stdout: 'abc123\n', stderr: '' })
    const hash = await initRepo('/tmp/test', 'msg')
    expect(hash).toBe('abc123')
  })
})

describe('commitFiles', () => {
  it('stages specified files then commits', async () => {
    await commitFiles('/tmp/repo', ['file.json'], 'update')

    const calls = mockExecFile.mock.calls
    // git add
    expect(calls[0][1]).toContain('add')
    expect(calls[0][1]).toContain('file.json')
    // git commit
    expect(calls[1][1]).toContain('commit')
  })

  it('passes commit message as argument (not shell-interpolated)', async () => {
    const dangerousMsg = 'Update: $(rm -rf /)'
    await commitFiles('/tmp/repo', ['f.txt'], dangerousMsg)

    const commitCall = mockExecFile.mock.calls[1]
    expect(commitCall[0]).toBe('git')
    // Message is in the args array, not a shell string
    expect(commitCall[1]).toContain(dangerousMsg)
  })
})

describe('createArchive', () => {
  it('calls git archive with zip format', async () => {
    mockExecFile.mockResolvedValue({ stdout: Buffer.from('zipdata'), stderr: '' })
    await createArchive('/tmp/repo')

    expect(mockExecFile.mock.calls[0][0]).toBe('git')
    expect(mockExecFile.mock.calls[0][1]).toContain('archive')
    expect(mockExecFile.mock.calls[0][1]).toContain('--format=zip')
  })

  it('returns a Buffer', async () => {
    mockExecFile.mockResolvedValue({ stdout: Buffer.from('zipdata'), stderr: '' })
    const result = await createArchive('/tmp/repo')
    expect(Buffer.isBuffer(result)).toBe(true)
  })
})

describe('getHistory', () => {
  it('parses git log output into structured commits', async () => {
    mockExecFile.mockResolvedValue({
      stdout: 'abc123|2026-03-19|Initial commit\ndef456|2026-03-19|Update info\n',
      stderr: '',
    })
    const history = await getHistory('/tmp/repo', 10)
    expect(history).toHaveLength(2)
    expect(history[0].hash).toBe('abc123')
    expect(history[0].message).toBe('Initial commit')
  })

  it('returns empty array for empty output', async () => {
    mockExecFile.mockResolvedValue({ stdout: '', stderr: '' })
    const history = await getHistory('/tmp/repo', 10)
    expect(history).toEqual([])
  })
})
