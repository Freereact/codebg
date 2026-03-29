import crypto from 'node:crypto'

/** Names that must never be used as subdomains — system routes, protocols, common infra */
const RESERVED_NAMES = new Set([
  // System routes
  'admin',
  'api',
  'app',
  'auth',
  'billing',
  'blog',
  'cdn',
  'checkout',
  'dashboard',
  'docs',
  'feedback',
  'healthz',
  'hooks',
  'login',
  'logout',
  'mail',
  'portal',
  'preview',
  'register',
  'signup',
  'sites',
  'status',
  'verify',
  'webhooks',
  // Infrastructure
  'ftp',
  'imap',
  'ns1',
  'ns2',
  'pop',
  'smtp',
  'ssh',
  'vpn',
  'www',
  // Brand protection
  'codebg',
  'codebg-team',
  'test',
  'demo',
  'example',
  'sample',
  'staging',
  'production',
  'dev',
])

const MIN_SUBDOMAIN_LENGTH = 3

export function slugifyBusinessName(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)
    .replace(/-$/, '')

  if (!slug || slug.length < MIN_SUBDOMAIN_LENGTH) {
    slug = `site-${crypto.randomBytes(4).toString('hex')}`
  }

  return slug
}

export function isReservedSubdomain(subdomain: string): boolean {
  return RESERVED_NAMES.has(subdomain)
}

export async function generateUniqueSubdomain(
  businessName: string,
  checkExists: (subdomain: string) => Promise<boolean>,
): Promise<string> {
  let base = slugifyBusinessName(businessName)

  // If the slug is reserved, add a random suffix immediately
  if (isReservedSubdomain(base)) {
    base = `${base}-${crypto.randomBytes(2).toString('hex')}`
  }

  if (!(await checkExists(base))) {
    return base
  }

  for (let i = 0; i < 10; i++) {
    const suffix = crypto.randomBytes(2).toString('hex')
    const candidate = `${base}-${suffix}`
    if (!isReservedSubdomain(candidate) && !(await checkExists(candidate))) {
      return candidate
    }
  }

  return `${base}-${crypto.randomBytes(4).toString('hex')}`
}
