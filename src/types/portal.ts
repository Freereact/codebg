// ============================================================================
// Shared enums (mirror backend types — match SQL CHECK constraints)
// ============================================================================

export type ProjectStatus =
  | 'draft'
  | 'building'
  | 'preview'
  | 'lead'
  | 'paid'
  | 'brief_received'
  | 'draft_ready'
  | 'in_review'
  | 'revisions'
  | 'live'
  | 'maintenance'
  | 'cancelled'

export type PlanTier = 'starter' | 'professional' | 'custom'

export type FeedbackStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'

// ============================================================================
// API response types
// ============================================================================

export interface ProjectListItem {
  readonly id: string
  readonly status: ProjectStatus
  readonly statusLabel: string
  readonly domain: string | null
  readonly subdomain: string | null
  readonly templateSlug: string | null
  readonly planTier: PlanTier | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ProjectDetail extends ProjectListItem {
  readonly siteConfig: Record<string, unknown>
  readonly setupFeeCents: number | null
  readonly paidAt: string | null
  readonly briefReceivedAt: string | null
  readonly draftReadyAt: string | null
  readonly launchedAt: string | null
  readonly cancelledAt: string | null
}

export interface TemplateMeta {
  readonly slug: string
  readonly title: string
  readonly description: string
  readonly tags: readonly string[]
}

export interface BusinessInfoInput {
  name: string
  phone: string
  address: string
  hours: string
  email?: string
  tagline?: string
}

export interface CreateProjectInput {
  templateSlug: string
  businessInfo: BusinessInfoInput
}

export interface PaginatedResponse<T> {
  readonly ok: true
  readonly data: readonly T[]
  readonly pagination: {
    readonly total: number
    readonly limit: number
    readonly offset: number
    readonly hasMore: boolean
  }
}
