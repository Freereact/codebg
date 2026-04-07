import { describe, it, expect } from 'vitest'
import { domainSchema, setDomainSchema } from '../src/projects/domain-validation.js'

describe('domainSchema', () => {
  it('accepts valid domains', () => {
    expect(domainSchema.parse('example.com')).toBe('example.com')
    expect(domainSchema.parse('my-site.example.co.uk')).toBe('my-site.example.co.uk')
    expect(domainSchema.parse('sub.domain.org')).toBe('sub.domain.org')
  })

  it('normalizes to lowercase', () => {
    expect(domainSchema.parse('Example.COM')).toBe('example.com')
    expect(domainSchema.parse('MY-SITE.Ca')).toBe('my-site.ca')
  })

  it('strips protocol prefix', () => {
    expect(domainSchema.parse('https://example.com')).toBe('example.com')
    expect(domainSchema.parse('http://example.com')).toBe('example.com')
  })

  it('strips trailing slashes and dots', () => {
    expect(domainSchema.parse('example.com/')).toBe('example.com')
    expect(domainSchema.parse('example.com.')).toBe('example.com')
    expect(domainSchema.parse('example.com///')).toBe('example.com')
  })

  it('rejects domains shorter than 4 chars', () => {
    expect(() => domainSchema.parse('a.b')).toThrow()
  })

  it('rejects single-label domains (no TLD)', () => {
    expect(() => domainSchema.parse('localhost')).toThrow()
  })

  it('rejects domains with invalid characters', () => {
    expect(() => domainSchema.parse('exam ple.com')).toThrow()
    expect(() => domainSchema.parse('exam_ple.com')).toThrow()
    expect(() => domainSchema.parse('example!.com')).toThrow()
  })

  it('rejects codebg.com subdomains', () => {
    expect(() => domainSchema.parse('test.codebg.com')).toThrow(/codebg\.com/)
    expect(() => domainSchema.parse('my-site.codebg.com')).toThrow(/codebg\.com/)
  })

  it('allows domains that contain codebg but are not subdomains', () => {
    expect(domainSchema.parse('codebg.ca')).toBe('codebg.ca')
    expect(domainSchema.parse('mycodebg.com')).toBe('mycodebg.com')
  })
})

describe('setDomainSchema', () => {
  it('validates domain field in object', () => {
    const result = setDomainSchema.parse({ domain: 'example.com' })
    expect(result.domain).toBe('example.com')
  })

  it('rejects missing domain field', () => {
    expect(() => setDomainSchema.parse({})).toThrow()
  })

  it('rejects non-string domain', () => {
    expect(() => setDomainSchema.parse({ domain: 123 })).toThrow()
  })
})
