import { describe, expect, it } from 'vitest'
import { createProjectBodySchema, updateProjectBodySchema, TEMPLATE_SLUGS } from '../src/projects/site-config-schema.js'

describe('createProjectBodySchema', () => {
  const validInput = {
    templateSlug: 'bakery',
    businessInfo: {
      name: 'Sunrise Bakery',
      phone: '(250) 555-0366',
      address: 'Penticton, BC',
      hours: 'Mon-Sat 7am-5pm',
    },
  }

  it('accepts valid minimal input', () => {
    const result = createProjectBodySchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts input with optional fields', () => {
    const result = createProjectBodySchema.safeParse({
      ...validInput,
      businessInfo: {
        ...validInput.businessInfo,
        email: 'hello@sunrise.com',
        tagline: 'Baked fresh every morning',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects unknown templateSlug', () => {
    const result = createProjectBodySchema.safeParse({
      ...validInput,
      templateSlug: 'unknown-template',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing businessInfo.name', () => {
    const result = createProjectBodySchema.safeParse({
      templateSlug: 'bakery',
      businessInfo: {
        phone: '555-1234',
        address: 'City',
        hours: '9-5',
      },
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing templateSlug', () => {
    const result = createProjectBodySchema.safeParse({
      businessInfo: validInput.businessInfo,
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty business name', () => {
    const result = createProjectBodySchema.safeParse({
      ...validInput,
      businessInfo: { ...validInput.businessInfo, name: '' },
    })
    expect(result.success).toBe(false)
  })

  it('rejects business name over 200 chars', () => {
    const result = createProjectBodySchema.safeParse({
      ...validInput,
      businessInfo: { ...validInput.businessInfo, name: 'x'.repeat(201) },
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid template slugs', () => {
    for (const slug of TEMPLATE_SLUGS) {
      const result = createProjectBodySchema.safeParse({
        templateSlug: slug,
        businessInfo: validInput.businessInfo,
      })
      expect(result.success, `should accept slug: ${slug}`).toBe(true)
    }
  })
})

describe('updateProjectBodySchema', () => {
  it('accepts partial businessInfo update', () => {
    const result = updateProjectBodySchema.safeParse({
      businessInfo: { name: 'New Name' },
    })
    expect(result.success).toBe(true)
  })

  it('accepts full businessInfo update', () => {
    const result = updateProjectBodySchema.safeParse({
      businessInfo: {
        name: 'New Name',
        phone: '555-9999',
        address: 'New City',
        hours: '10-6',
        email: 'new@example.com',
        tagline: 'New tagline',
      },
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty object', () => {
    const result = updateProjectBodySchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
