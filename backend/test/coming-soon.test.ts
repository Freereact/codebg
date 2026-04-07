import { describe, it, expect } from 'vitest'
import { updateProjectBodySchema } from '../src/projects/site-config-schema.js'

describe('updateProjectBodySchema with comingSoon', () => {
  it('accepts comingSoon: true without businessInfo', () => {
    const result = updateProjectBodySchema.safeParse({ comingSoon: true })
    expect(result.success).toBe(true)
  })

  it('accepts comingSoon: false without businessInfo', () => {
    const result = updateProjectBodySchema.safeParse({ comingSoon: false })
    expect(result.success).toBe(true)
  })

  it('accepts both comingSoon and businessInfo together', () => {
    const result = updateProjectBodySchema.safeParse({
      comingSoon: true,
      businessInfo: { name: 'Updated Bakery' },
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty object (no fields)', () => {
    const result = updateProjectBodySchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects non-boolean comingSoon', () => {
    const result = updateProjectBodySchema.safeParse({ comingSoon: 'yes' })
    expect(result.success).toBe(false)
  })

  it('still accepts businessInfo alone (backwards compatible)', () => {
    const result = updateProjectBodySchema.safeParse({
      businessInfo: { phone: '(250) 555-1234' },
    })
    expect(result.success).toBe(true)
  })
})
