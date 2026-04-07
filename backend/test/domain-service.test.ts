import { describe, it, expect, vi, beforeEach } from 'vitest'
import dns from 'node:dns/promises'
import { verifyDns, getDnsInstructions } from '../src/projects/domain-service.js'

vi.mock('node:dns/promises')
vi.mock('../src/db.js', () => ({ prisma: {} }))
vi.mock('../src/config.js', () => ({
  config: {
    customDomainCnameTarget: 'custom.codebg.com',
    serverPublicIp: '146.190.243.12',
    domainTasksDir: '/tmp/test-domain-tasks',
  },
}))

const mockDns = vi.mocked(dns)

describe('verifyDns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns verified via CNAME when CNAME matches target', async () => {
    mockDns.resolveCname.mockResolvedValue(['custom.codebg.com'])

    const result = await verifyDns('mybusiness.com')

    expect(result.verified).toBe(true)
    expect(result.method).toBe('cname')
  })

  it('returns verified via A record when IP matches', async () => {
    mockDns.resolveCname.mockRejectedValue(new Error('ENOTFOUND'))
    mockDns.resolve4.mockResolvedValue(['146.190.243.12'])

    const result = await verifyDns('mybusiness.com')

    expect(result.verified).toBe(true)
    expect(result.method).toBe('a_record')
  })

  it('returns not verified when CNAME points elsewhere', async () => {
    mockDns.resolveCname.mockResolvedValue(['other-server.com'])
    mockDns.resolve4.mockResolvedValue(['1.2.3.4'])

    const result = await verifyDns('mybusiness.com')

    expect(result.verified).toBe(false)
    expect(result.reason).toContain('DNS not pointing')
  })

  it('returns not verified when all DNS lookups fail', async () => {
    mockDns.resolveCname.mockRejectedValue(new Error('ENOTFOUND'))
    mockDns.resolve4.mockRejectedValue(new Error('ENOTFOUND'))

    const result = await verifyDns('mybusiness.com')

    expect(result.verified).toBe(false)
  })

  it('is case-insensitive for CNAME matching', async () => {
    mockDns.resolveCname.mockResolvedValue(['Custom.Codebg.Com'])

    const result = await verifyDns('mybusiness.com')

    expect(result.verified).toBe(true)
    expect(result.method).toBe('cname')
  })
})

describe('getDnsInstructions', () => {
  it('returns CNAME and A record instructions', () => {
    const instructions = getDnsInstructions('mybusiness.com')

    expect(instructions.type).toBe('CNAME')
    expect(instructions.name).toBe('mybusiness.com')
    expect(instructions.target).toBe('custom.codebg.com')
    expect(instructions.alternativeType).toBe('A')
    expect(instructions.alternativeTarget).toBe('146.190.243.12')
  })
})
