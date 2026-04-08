import { z } from 'zod'

export const magicLinkSchema = z.object({
  email: z.string().email().max(320),
  turnstileToken: z.string().min(10),
})

export const verifyTokenSchema = z.object({
  token: z
    .string()
    .length(64)
    .regex(/^[0-9a-f]+$/),
})
