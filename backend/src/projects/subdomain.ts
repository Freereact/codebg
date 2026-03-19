import crypto from 'node:crypto'

export function slugifyBusinessName(name: string): string {
  let slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)
    .replace(/-$/, '')

  if (!slug) {
    slug = `site-${crypto.randomBytes(4).toString('hex')}`
  }

  return slug
}

export async function generateUniqueSubdomain(
  businessName: string,
  checkExists: (subdomain: string) => Promise<boolean>,
): Promise<string> {
  const base = slugifyBusinessName(businessName)

  if (!(await checkExists(base))) {
    return base
  }

  for (let i = 0; i < 10; i++) {
    const suffix = crypto.randomBytes(2).toString('hex')
    const candidate = `${base}-${suffix}`
    if (!(await checkExists(candidate))) {
      return candidate
    }
  }

  return `${base}-${crypto.randomBytes(4).toString('hex')}`
}
