import { describe, expect, it } from 'vitest'
import { emailJobSchema, isAllowedOrigin } from '../src/validation.js'

describe('validation', () => {
  it('accepts valid payload', () => {
    const parsed = emailJobSchema.safeParse({
      name: 'Alex',
      email: 'alex@example.com',
      message: 'This is a real project brief with enough length.',
      turnstileToken: 'token-1234567890',
    })
    expect(parsed.success).toBe(true)
  })

  it('checks allowed origin', () => {
    expect(isAllowedOrigin('https://codebg.com', ['https://codebg.com'])).toBe(true)
    expect(isAllowedOrigin('https://evil.com', ['https://codebg.com'])).toBe(false)
  })
})
