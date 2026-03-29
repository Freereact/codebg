import { describe, expect, it } from 'vitest'
import {
  adminProjectsQuerySchema,
  adminUsersQuerySchema,
  adminFeedbackQuerySchema,
  updateProjectStatusSchema,
  createNoteSchema,
} from '../src/admin/validation.js'

describe('adminProjectsQuerySchema', () => {
  it('accepts empty query with defaults', () => {
    const result = adminProjectsQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.limit).toBe(20)
      expect(result.data.offset).toBe(0)
    }
  })

  it('accepts status filter', () => {
    const result = adminProjectsQuerySchema.safeParse({ status: 'preview' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe('preview')
  })

  it('accepts search filter', () => {
    const result = adminProjectsQuerySchema.safeParse({ search: 'bakery' })
    expect(result.success).toBe(true)
  })

  it('rejects limit over 100', () => {
    expect(adminProjectsQuerySchema.safeParse({ limit: '200' }).success).toBe(false)
  })
})

describe('adminUsersQuerySchema', () => {
  it('accepts empty query', () => {
    expect(adminUsersQuerySchema.safeParse({}).success).toBe(true)
  })

  it('accepts search', () => {
    expect(adminUsersQuerySchema.safeParse({ search: 'test@' }).success).toBe(true)
  })
})

describe('adminFeedbackQuerySchema', () => {
  it('accepts status filter', () => {
    const result = adminFeedbackQuerySchema.safeParse({ status: 'pending' })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(adminFeedbackQuerySchema.safeParse({ status: 'invalid' }).success).toBe(false)
  })

  it('defaults to 50 limit', () => {
    const result = adminFeedbackQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.limit).toBe(50)
  })
})

describe('updateProjectStatusSchema', () => {
  it('accepts valid status', () => {
    expect(updateProjectStatusSchema.safeParse({ status: 'live' }).success).toBe(true)
  })

  it('rejects empty status', () => {
    expect(updateProjectStatusSchema.safeParse({ status: '' }).success).toBe(false)
  })

  it('rejects missing status', () => {
    expect(updateProjectStatusSchema.safeParse({}).success).toBe(false)
  })
})

describe('createNoteSchema', () => {
  it('accepts note with projectId', () => {
    const result = createNoteSchema.safeParse({
      projectId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'Client wants blue theme',
    })
    expect(result.success).toBe(true)
  })

  it('accepts note with userId', () => {
    const result = createNoteSchema.safeParse({
      userId: '550e8400-e29b-41d4-a716-446655440000',
      content: 'VIP client',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty content', () => {
    expect(createNoteSchema.safeParse({ content: '' }).success).toBe(false)
  })

  it('rejects content over 10000 chars', () => {
    expect(createNoteSchema.safeParse({ content: 'x'.repeat(10_001) }).success).toBe(false)
  })

  it('defaults isPinned to false', () => {
    const result = createNoteSchema.safeParse({ content: 'test' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.isPinned).toBe(false)
  })
})
