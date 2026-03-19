import { describe, expect, it } from 'vitest'
import { createFeedbackSchema, updateFeedbackSchema } from '../src/projects/feedback-validation.js'

describe('createFeedbackSchema', () => {
  const valid = {
    sectionId: 'pricing-0',
    sectionTitle: 'Best sellers',
    description: 'Change sourdough price to $9',
  }

  it('accepts valid feedback', () => {
    expect(createFeedbackSchema.safeParse(valid).success).toBe(true)
  })

  it('rejects missing description', () => {
    expect(createFeedbackSchema.safeParse({ sectionId: 'hero', sectionTitle: 'Hero' }).success).toBe(false)
  })

  it('rejects empty description', () => {
    expect(createFeedbackSchema.safeParse({ ...valid, description: '' }).success).toBe(false)
  })

  it('rejects description over 2000 chars', () => {
    expect(createFeedbackSchema.safeParse({ ...valid, description: 'x'.repeat(2001) }).success).toBe(false)
  })

  it('rejects missing sectionId', () => {
    expect(createFeedbackSchema.safeParse({ sectionTitle: 'Hero', description: 'test' }).success).toBe(false)
  })

  it('accepts sectionId with various formats', () => {
    for (const id of ['hero', 'pricing-0', 'benefits-1', 'topbar', 'footer']) {
      expect(createFeedbackSchema.safeParse({ ...valid, sectionId: id }).success).toBe(true)
    }
  })
})

describe('updateFeedbackSchema', () => {
  it('accepts status update', () => {
    expect(updateFeedbackSchema.safeParse({ status: 'in_progress' }).success).toBe(true)
  })

  it('accepts admin response', () => {
    expect(updateFeedbackSchema.safeParse({ status: 'completed', adminResponse: 'Done!' }).success).toBe(true)
  })

  it('rejects invalid status', () => {
    expect(updateFeedbackSchema.safeParse({ status: 'invalid' }).success).toBe(false)
  })

  it('rejects empty update', () => {
    expect(updateFeedbackSchema.safeParse({}).success).toBe(false)
  })
})
