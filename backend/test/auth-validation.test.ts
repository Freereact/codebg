import { describe, expect, it } from 'vitest'
import { magicLinkSchema, verifyTokenSchema } from '../src/auth/validation.js'

describe('magicLinkSchema', () => {
  it('accepts a valid email', () => {
    const result = magicLinkSchema.safeParse({ email: 'user@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects missing email', () => {
    const result = magicLinkSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects invalid email format', () => {
    const result = magicLinkSchema.safeParse({ email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('rejects email exceeding 320 chars', () => {
    const result = magicLinkSchema.safeParse({ email: 'a'.repeat(310) + '@example.com' })
    expect(result.success).toBe(false)
  })

  it('accepts email at max length boundary', () => {
    const local = 'a'.repeat(305)
    const email = `${local}@ex.com` // 312 chars
    const result = magicLinkSchema.safeParse({ email })
    expect(result.success).toBe(true)
  })
})

describe('verifyTokenSchema', () => {
  it('accepts a valid 64-char hex token', () => {
    const token = 'a'.repeat(64)
    const result = verifyTokenSchema.safeParse({ token })
    expect(result.success).toBe(true)
  })

  it('accepts a realistic token (random hex)', () => {
    const token = 'abcdef0123456789'.repeat(4) // 64 chars
    const result = verifyTokenSchema.safeParse({ token })
    expect(result.success).toBe(true)
  })

  it('rejects token shorter than 64 chars', () => {
    const result = verifyTokenSchema.safeParse({ token: 'abc123' })
    expect(result.success).toBe(false)
  })

  it('rejects token longer than 64 chars', () => {
    const result = verifyTokenSchema.safeParse({ token: 'a'.repeat(65) })
    expect(result.success).toBe(false)
  })

  it('rejects non-hex characters', () => {
    const result = verifyTokenSchema.safeParse({ token: 'g'.repeat(64) })
    expect(result.success).toBe(false)
  })

  it('rejects uppercase hex', () => {
    const result = verifyTokenSchema.safeParse({ token: 'A'.repeat(64) })
    expect(result.success).toBe(false)
  })

  it('rejects empty token', () => {
    const result = verifyTokenSchema.safeParse({ token: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing token field', () => {
    const result = verifyTokenSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
