import { z } from 'zod'

export const adminProjectsQuerySchema = z.object({
  status: z.string().optional(),
  search: z.string().max(200).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 20))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 0))
    .pipe(z.number().int().min(0).max(100_000)),
})

export type AdminProjectsQuery = z.output<typeof adminProjectsQuerySchema>

export const adminUsersQuerySchema = z.object({
  search: z.string().max(200).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 20))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 0))
    .pipe(z.number().int().min(0).max(100_000)),
})

export type AdminUsersQuery = z.output<typeof adminUsersQuerySchema>

export const adminFeedbackQuerySchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'rejected']).optional(),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 50))
    .pipe(z.number().int().min(1).max(100)),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 0))
    .pipe(z.number().int().min(0).max(100_000)),
})

export type AdminFeedbackQuery = z.output<typeof adminFeedbackQuerySchema>

export const updateProjectStatusSchema = z.object({
  status: z.string().min(1).max(50),
})

export type UpdateProjectStatusInput = z.output<typeof updateProjectStatusSchema>

export const createNoteSchema = z.object({
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  content: z.string().min(1).max(10_000),
  isPinned: z.boolean().optional().default(false),
})

export type CreateNoteInput = z.output<typeof createNoteSchema>
