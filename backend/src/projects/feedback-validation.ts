import { z } from 'zod'

export const createFeedbackSchema = z.object({
  sectionId: z.string().min(1).max(100),
  sectionTitle: z.string().min(1).max(300),
  description: z.string().min(1).max(2000),
})

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>

export const updateFeedbackSchema = z
  .object({
    status: z.enum(['pending', 'in_progress', 'completed', 'rejected']).optional(),
    adminResponse: z.string().max(2000).optional(),
  })
  .refine((obj) => obj.status !== undefined || obj.adminResponse !== undefined, {
    message: 'At least one field must be provided',
  })

export type UpdateFeedbackInput = z.infer<typeof updateFeedbackSchema>

export const feedbackIdSchema = z.object({
  feedbackId: z.string().uuid('invalid feedback id'),
})
