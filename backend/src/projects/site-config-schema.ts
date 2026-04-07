import { z } from 'zod'

export const TEMPLATE_SLUGS = ['autoshop', 'bakery', 'dental', 'massage', 'skaha-cafe', 'winery'] as const
export type TemplateSlug = (typeof TEMPLATE_SLUGS)[number]

export const businessInfoSchema = z.object({
  name: z.string().min(1).max(200),
  phone: z.string().min(5).max(30),
  address: z.string().min(1).max(500),
  hours: z.string().min(1).max(500),
  email: z.string().email().optional(),
  tagline: z.string().max(500).optional(),
})

export type BusinessInfo = z.infer<typeof businessInfoSchema>

export const createProjectBodySchema = z.object({
  templateSlug: z.enum(TEMPLATE_SLUGS),
  businessInfo: businessInfoSchema,
})

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>

export const updateProjectBodySchema = z
  .object({
    businessInfo: businessInfoSchema
      .partial()
      .refine((obj) => Object.keys(obj).length > 0, {
        message: 'At least one field must be provided',
      })
      .optional(),
    comingSoon: z.boolean().optional(),
  })
  .refine((obj) => obj.businessInfo || obj.comingSoon !== undefined, {
    message: 'At least one field must be provided',
  })

export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>
