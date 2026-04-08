import { describe, expect, it } from 'vitest'
import { createMessageSchema, createAdminMessageSchema } from '../src/projects/message-validation.js'

describe('createMessageSchema', () => {
  it('accepts a valid message body', () => {
    const result = createMessageSchema.safeParse({ body: 'Please change the headline' })
    expect(result.success).toBe(true)
  })

  it('rejects empty body', () => {
    const result = createMessageSchema.safeParse({ body: '' })
    expect(result.success).toBe(false)
  })

  it('rejects body exceeding 4000 chars', () => {
    const result = createMessageSchema.safeParse({ body: 'x'.repeat(4001) })
    expect(result.success).toBe(false)
  })

  it('accepts body at max length', () => {
    const result = createMessageSchema.safeParse({ body: 'x'.repeat(4000) })
    expect(result.success).toBe(true)
  })

  it('rejects missing body field', () => {
    const result = createMessageSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe('createAdminMessageSchema', () => {
  it('accepts body without status', () => {
    const result = createAdminMessageSchema.safeParse({ body: 'Done, check the preview.' })
    expect(result.success).toBe(true)
  })

  it('accepts body with valid status', () => {
    const result = createAdminMessageSchema.safeParse({ body: 'Working on it.', status: 'in_progress' })
    expect(result.success).toBe(true)
  })

  it('accepts all valid status values', () => {
    for (const status of ['pending', 'in_progress', 'completed', 'rejected']) {
      const result = createAdminMessageSchema.safeParse({ body: 'msg', status })
      expect(result.success, `status ${status} should be valid`).toBe(true)
    }
  })

  it('rejects invalid status value', () => {
    const result = createAdminMessageSchema.safeParse({ body: 'msg', status: 'unknown' })
    expect(result.success).toBe(false)
  })

  it('rejects empty body', () => {
    const result = createAdminMessageSchema.safeParse({ body: '' })
    expect(result.success).toBe(false)
  })
})
