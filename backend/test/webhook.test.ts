import { describe, expect, it, vi } from 'vitest'
import crypto from 'node:crypto'

vi.mock('../src/config.js', () => ({
  config: {
    ghWebhookSecret: 'test-webhook-secret',
    ghAppId: '',
    ghAppPrivateKey: '',
    ghAppInstallationId: 0,
    ghOrg: '',
  },
}))

// Mock execFile (required by github-service imports)
vi.mock('node:child_process', () => ({
  execFile: vi.fn(),
}))
vi.mock('node:util', async () => {
  const actual = await vi.importActual<typeof import('node:util')>('node:util')
  return { ...actual, promisify: () => vi.fn() }
})

const { verifyWebhookSignature } = await import('../src/github/github-service.js')

describe('verifyWebhookSignature', () => {
  const secret = 'test-webhook-secret'

  it('returns true for valid signature with string payload', () => {
    const payload = '{"action":"push","ref":"refs/heads/main"}'
    const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
    expect(verifyWebhookSignature(payload, sig)).toBe(true)
  })

  it('returns true for valid signature with Buffer payload', () => {
    const payload = Buffer.from('{"action":"push"}')
    const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex')
    expect(verifyWebhookSignature(payload, sig)).toBe(true)
  })

  it('returns false for tampered payload', () => {
    const payload = '{"action":"push"}'
    const sig = 'sha256=' + crypto.createHmac('sha256', secret).update('different').digest('hex')
    expect(verifyWebhookSignature(payload, sig)).toBe(false)
  })

  it('returns false for wrong secret', () => {
    const payload = '{"action":"push"}'
    const sig = 'sha256=' + crypto.createHmac('sha256', 'wrong-secret').update(payload).digest('hex')
    expect(verifyWebhookSignature(payload, sig)).toBe(false)
  })

  it('detects re-serialization mismatch (the original S1 bug)', () => {
    const rawPayload = '{"key": "value"}'
    const sig = 'sha256=' + crypto.createHmac('sha256', secret).update(rawPayload).digest('hex')
    const reserialized = JSON.stringify(JSON.parse(rawPayload))
    expect(reserialized).not.toBe(rawPayload)
    expect(verifyWebhookSignature(rawPayload, sig)).toBe(true)
    expect(verifyWebhookSignature(reserialized, sig)).toBe(false)
  })
})
