import { apiFetch } from './api'
import type { DomainStatus } from '../types/portal'

interface DnsInstructions {
  type: string
  name: string
  target: string
  alternativeType: string
  alternativeTarget: string
}

interface SetDomainResponse {
  ok: true
  data: { domain: string; domainStatus: DomainStatus; dnsInstructions: DnsInstructions }
}

interface VerifyDnsResponse {
  ok: true
  data: {
    domain: string
    domainStatus: DomainStatus
    verified: boolean
    reason?: string
    method?: string
    dnsInstructions?: DnsInstructions
  }
}

interface DomainStatusResponse {
  ok: true
  data: { domain: string | null; domainStatus: DomainStatus | null; domainError?: string | null }
}

type ApiResult<T> = T | { ok: false; error: string }

export async function setDomain(projectId: string, domain: string): Promise<ApiResult<SetDomainResponse>> {
  return apiFetch(`/api/projects/${projectId}/domain`, {
    method: 'POST',
    body: JSON.stringify({ domain }),
  })
}

export async function verifyDomainDns(projectId: string): Promise<ApiResult<VerifyDnsResponse>> {
  return apiFetch(`/api/projects/${projectId}/domain/verify`, { method: 'POST' })
}

export async function getDomainStatus(projectId: string): Promise<ApiResult<DomainStatusResponse>> {
  return apiFetch(`/api/projects/${projectId}/domain/status`)
}

export async function removeDomain(projectId: string): Promise<ApiResult<{ ok: true }>> {
  return apiFetch(`/api/projects/${projectId}/domain`, { method: 'DELETE' })
}
