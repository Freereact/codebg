import { z } from 'zod'
import { PROJECT_STATUSES, FEEDBACK_STATUSES } from '../projects/types.js'

export const adminProjectsQuerySchema = z.object({
  status: z.enum(PROJECT_STATUSES).optional(),
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
  status: z.enum(FEEDBACK_STATUSES).optional(),
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
  status: z.enum(PROJECT_STATUSES),
})

export type UpdateProjectStatusInput = z.output<typeof updateProjectStatusSchema>

export const adminUserIdSchema = z.object({
  id: z.string().uuid('invalid user id'),
})

export const createNoteSchema = z.object({
  userId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  content: z.string().min(1).max(10_000),
  isPinned: z.boolean().optional().default(false),
})

export type CreateNoteInput = z.output<typeof createNoteSchema>
