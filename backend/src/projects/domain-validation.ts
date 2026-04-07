import { z } from 'zod'

/** Valid domain: lowercase hostname, 4-253 chars, no protocol, no trailing dot */
export const domainSchema = z
  .string()
  .min(4)
  .max(253)
  .transform((s) =>
    s
      .toLowerCase()
      .trim()
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '')
      .replace(/\.$/, ''),
  )
  .refine((s) => /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(s), {
    message: 'Invalid domain format',
  })
  .refine((s) => !s.endsWith('.codebg.com'), {
    message: 'Cannot use a codebg.com subdomain as a custom domain',
  })

export const setDomainSchema = z.object({
  domain: domainSchema,
})
