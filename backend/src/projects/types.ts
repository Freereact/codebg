import type { UserRole } from '../auth/types.js'

// ============================================================================
// Shared enums (match SQL CHECK constraints in 001_initial_schema.sql)
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

export const PROJECT_STATUSES = [
  'draft',
  'building',
  'preview',
  'lead',
  'paid',
  'brief_received',
  'draft_ready',
  'in_review',
  'revisions',
  'live',
  'maintenance',
  'cancelled',
] as const satisfies readonly ProjectStatus[]

export type PlanTier = 'starter' | 'professional' | 'custom'

export const PLAN_TIERS = ['starter', 'professional', 'custom'] as const satisfies readonly PlanTier[]

export type FeedbackStatus = 'pending' | 'in_progress' | 'completed' | 'rejected'

export const FEEDBACK_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'rejected',
] as const satisfies readonly FeedbackStatus[]

/** Human-readable status labels for the frontend */
export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: 'Setting up',
  building: 'Building preview',
  preview: 'Preview ready',
  lead: 'Getting started',
  paid: 'Payment received',
  brief_received: 'Brief submitted',
  draft_ready: 'Ready for review',
  in_review: 'Under review',
  revisions: 'Making changes',
  live: 'Live',
  maintenance: 'Live — maintained',
  cancelled: 'Cancelled',
}

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

export interface UserProfile {
  readonly id: string
  readonly email: string
  readonly name: string
  readonly phone: string | null
  readonly role: UserRole
  readonly createdAt: string
}

export { type CommitInfo } from './git-service.js'

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
