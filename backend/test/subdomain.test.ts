import { describe, expect, it } from 'vitest'
import { slugifyBusinessName, generateUniqueSubdomain } from '../src/projects/subdomain.js'

describe('slugifyBusinessName', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyBusinessName('Sunrise Bakery')).toBe('sunrise-bakery')
  })

  it('strips special characters', () => {
    expect(slugifyBusinessName("Joe's Auto & Repair!")).toBe('joes-auto-repair')
  })

  it('collapses multiple hyphens', () => {
    expect(slugifyBusinessName('Cafe -- Downtown')).toBe('cafe-downtown')
  })

  it('trims leading/trailing hyphens', () => {
    expect(slugifyBusinessName('  --Bakery-- ')).toBe('bakery')
  })

  it('truncates to 32 chars', () => {
    const long = 'This Is A Very Long Business Name That Exceeds Thirty Two Characters'
    const result = slugifyBusinessName(long)
    expect(result.length).toBeLessThanOrEqual(32)
    expect(result.endsWith('-')).toBe(false)
  })

  it('handles empty string', () => {
    const result = slugifyBusinessName('')
    expect(result.length).toBeGreaterThan(0)
  })

  it('handles string with only special characters', () => {
    const result = slugifyBusinessName('!!!@@@###')
    expect(result.length).toBeGreaterThan(0)
  })
})

describe('generateUniqueSubdomain', () => {
  it('returns slug directly if no collision', async () => {
    const checkExists = async () => false
    const result = await generateUniqueSubdomain('Sunrise Bakery', checkExists)
    expect(result).toBe('sunrise-bakery')
  })

  it('appends suffix on collision', async () => {
    let calls = 0
    const checkExists = async () => {
      calls++
      return calls === 1 // first call collides, second doesn't
    }
    const result = await generateUniqueSubdomain('Sunrise Bakery', checkExists)
    expect(result).toMatch(/^sunrise-bakery-[a-z0-9]{4}$/)
  })

  it('tries multiple suffixes if needed', async () => {
    let calls = 0
    const checkExists = async () => {
      calls++
      return calls <= 3
    }
    const result = await generateUniqueSubdomain('Test', checkExists)
    expect(result.startsWith('test')).toBe(true)
    expect(calls).toBe(4)
  })
})
