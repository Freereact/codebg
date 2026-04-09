import { z } from 'zod'

export const createMessageSchema = z.object({
  body: z.string().min(1).max(4000),
})

export const createAdminMessageSchema = z.object({
  body: z.string().min(1).max(4000),
  status: z.enum(['pending', 'in_progress', 'completed', 'rejected']).optional(),
})
