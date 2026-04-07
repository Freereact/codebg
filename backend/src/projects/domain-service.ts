import dns from 'node:dns/promises'
import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { prisma } from '../db.js'
import type { DomainStatus } from './types.js'

export interface DnsVerificationResult {
  verified: boolean
  method?: 'cname' | 'a_record'
  reason?: string
}

/**
 * Verify that a domain's DNS points to our server.
 * Checks CNAME → customDomainCnameTarget, then A record → serverPublicIp.
 */
export async function verifyDns(domain: string): Promise<DnsVerificationResult> {
  // Check CNAME first (preferred — survives server IP changes)
  try {
    const cnames = await dns.resolveCname(domain)
    if (cnames.some((c) => c.toLowerCase() === config.customDomainCnameTarget.toLowerCase())) {
      return { verified: true, method: 'cname' }
    }
  } catch {
    // CNAME lookup failed — try A record
  }

  // Check A record (for apex domains that can't use CNAME)
  if (config.serverPublicIp) {
    try {
      const addresses = await dns.resolve4(domain)
      if (addresses.includes(config.serverPublicIp)) {
        return { verified: true, method: 'a_record' }
      }
    } catch {
      // A record lookup failed
    }
  }

  return {
    verified: false,
    reason: `DNS not pointing to ${config.customDomainCnameTarget} (CNAME) or ${config.serverPublicIp} (A record)`,
  }
}

/**
 * Write a domain provisioning task file for the host-side script.
 */
export async function writeDomainTask(action: 'setup' | 'remove', domain: string, subdomain: string): Promise<void> {
  const taskDir = config.domainTasksDir
  await fs.mkdir(taskDir, { recursive: true })

  const task = {
    action,
    domain,
    subdomain,
    timestamp: new Date().toISOString(),
    certbotEmail: 'hello@codebg.com',
  }

  const taskFile = path.join(taskDir, `${domain}.json`)
  await fs.writeFile(taskFile, JSON.stringify(task, null, 2))
}

/**
 * Read a domain provisioning result file (written by the host-side script).
 * Returns null if no result yet.
 */
export async function readDomainResult(domain: string): Promise<{ success: boolean; error?: string } | null> {
  const resultFile = path.join(config.domainTasksDir, `${domain}.result.json`)
  try {
    const data = await fs.readFile(resultFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

/**
 * Update domain status in the database.
 */
export async function updateDomainStatus(
  projectId: string,
  status: DomainStatus | null,
  error?: string | null,
): Promise<void> {
  await prisma.project.update({
    where: { id: projectId },
    data: {
      domainStatus: status,
      domainError: error ?? null,
    },
  })
}

/**
 * Get DNS instructions for the customer.
 */
export function getDnsInstructions(domain: string) {
  return {
    type: 'CNAME' as const,
    name: domain,
    target: config.customDomainCnameTarget,
    alternativeType: 'A' as const,
    alternativeTarget: config.serverPublicIp || 'Contact support for server IP',
  }
}
