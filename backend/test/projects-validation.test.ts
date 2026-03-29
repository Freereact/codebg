import { describe, expect, it } from 'vitest'
import { listProjectsQuerySchema, projectIdSchema } from '../src/projects/validation.js'

describe('listProjectsQuerySchema', () => {
  it('accepts empty query (uses defaults)', () => {
    const result = listProjectsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
      expect(result.data.offset).toBe(0)
    }
  })

  it('parses string limit and offset from query params', () => {
    const result = listProjectsQuerySchema.safeParse({ limit: '10', offset: '5' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(10)
      expect(result.data.offset).toBe(5)
    }
  })

  it('rejects limit above 50', () => {
    const result = listProjectsQuerySchema.safeParse({ limit: '100' })
    expect(result.success).toBe(false)
  })

  it('rejects limit of 0', () => {
    const result = listProjectsQuerySchema.safeParse({ limit: '0' })
    expect(result.success).toBe(false)
  })

  it('rejects negative offset', () => {
    const result = listProjectsQuerySchema.safeParse({ offset: '-1' })
    expect(result.success).toBe(false)
  })

  it('rejects non-numeric limit', () => {
    const result = listProjectsQuerySchema.safeParse({ limit: 'abc' })
    expect(result.success).toBe(false)
  })
})

describe('projectIdSchema', () => {
  it('accepts a valid UUID', () => {
    const result = projectIdSchema.safeParse({ id: '550e8400-e29b-41d4-a716-446655440000' })
    expect(result.success).toBe(true)
  })

  it('rejects a non-UUID string', () => {
    const result = projectIdSchema.safeParse({ id: 'not-a-uuid' })
    expect(result.success).toBe(false)
  })

  it('rejects empty string', () => {
    const result = projectIdSchema.safeParse({ id: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing id', () => {
    const result = projectIdSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
