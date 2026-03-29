import { z } from 'zod'

export const createCheckoutSchema = z.object({
  projectId: z.string().uuid(),
  tier: z.enum(['starter', 'professional']),
})

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>
