import { z } from 'zod'

export const listProjectsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 20))
    .pipe(z.number().int().min(1).max(50)),
  offset: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 0))
    .pipe(z.number().int().min(0).max(100_000)),
})

export const projectIdSchema = z.object({
  id: z.string().uuid('invalid project id'),
})

export type ListProjectsQuery = z.output<typeof listProjectsQuerySchema>
