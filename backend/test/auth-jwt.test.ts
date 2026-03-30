import crypto from 'node:crypto'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'

// Mock config before importing auth-service
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

// Mock prisma — these tests only cover JWT logic
vi.mock('../src/db.js', () => ({
  prisma: {},
}))

// Import after mocks
const { signJwt, verifyJwt } = await import('../src/auth/auth-service.js')

describe('signJwt', () => {
  it('produces a valid JWT string', () => {
    const token = signJwt({ sub: 'user-1', email: 'a@b.com', role: 'client' })
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })

  it('encodes the correct payload fields', () => {
    const token = signJwt({ sub: 'user-1', email: 'a@b.com', role: 'admin' })
    const decoded = jwt.decode(token) as Record<string, unknown>
    expect(decoded.sub).toBe('user-1')
    expect(decoded.email).toBe('a@b.com')
    expect(decoded.role).toBe('admin')
  })

  it('uses HS256 algorithm', () => {
    const token = signJwt({ sub: 'user-1', email: 'a@b.com', role: 'client' })
    const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString())
    expect(header.alg).toBe('HS256')
  })

  it('includes an expiration claim', () => {
    const token = signJwt({ sub: 'user-1', email: 'a@b.com', role: 'client' })
    const decoded = jwt.decode(token) as Record<string, unknown>
    expect(decoded.exp).toBeDefined()
    expect(typeof decoded.exp).toBe('number')
  })
})

describe('verifyJwt', () => {
  it('returns payload for a valid token', () => {
    const token = signJwt({ sub: 'user-1', email: 'a@b.com', role: 'client' })
    const result = verifyJwt(token)
    expect(result).not.toBeNull()
    expect(result!.sub).toBe('user-1')
    expect(result!.email).toBe('a@b.com')
    expect(result!.role).toBe('client')
  })

  it('returns null for an expired token', () => {
    const token = jwt.sign({ sub: 'user-1', email: 'a@b.com', role: 'client' }, TEST_SECRET, {
      algorithm: 'HS256',
      expiresIn: '-1s',
    })
    expect(verifyJwt(token)).toBeNull()
  })

  it('returns null for a token signed with wrong secret', () => {
    const token = jwt.sign({ sub: 'user-1', email: 'a@b.com', role: 'client' }, 'wrong-secret', { algorithm: 'HS256' })
    expect(verifyJwt(token)).toBeNull()
  })

  it('returns null for a token with alg:none', () => {
    const token = jwt.sign({ sub: 'user-1', email: 'a@b.com', role: 'client' }, '', {
      algorithm: 'none' as jwt.Algorithm,
    })
    expect(verifyJwt(token)).toBeNull()
  })

  it('returns null for a malformed token string', () => {
    expect(verifyJwt('not.a.jwt')).toBeNull()
    expect(verifyJwt('')).toBeNull()
    expect(verifyJwt('garbage')).toBeNull()
  })

  it('returns null if payload is missing required fields', () => {
    const token = jwt.sign({ sub: 'user-1' }, TEST_SECRET, { algorithm: 'HS256' })
    expect(verifyJwt(token)).toBeNull()
  })

  it('returns null if payload is a string (non-object)', () => {
    const token = jwt.sign('just-a-string', TEST_SECRET, { algorithm: 'HS256' })
    expect(verifyJwt(token)).toBeNull()
  })
})

describe('token hashing consistency', () => {
  it('SHA-256 of the same input always produces the same hash', () => {
    const raw = 'a'.repeat(64)
    const hash1 = crypto.createHash('sha256').update(raw).digest('hex')
    const hash2 = crypto.createHash('sha256').update(raw).digest('hex')
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64)
  })

  it('different inputs produce different hashes', () => {
    const hash1 = crypto.createHash('sha256').update('token-a').digest('hex')
    const hash2 = crypto.createHash('sha256').update('token-b').digest('hex')
    expect(hash1).not.toBe(hash2)
  })

  it('raw token (32 bytes hex) is 64 chars', () => {
    const raw = crypto.randomBytes(32).toString('hex')
    expect(raw).toHaveLength(64)
    expect(raw).toMatch(/^[0-9a-f]+$/)
  })
})
