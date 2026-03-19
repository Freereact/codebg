/** Human-readable status labels for the frontend */
export const PROJECT_STATUS_LABELS: Record<string, string> = {
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

export interface ProjectListItem {
  readonly id: string
  readonly status: string
  readonly statusLabel: string
  readonly domain: string | null
  readonly subdomain: string | null
  readonly templateSlug: string | null
  readonly planTier: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export interface ProjectDetail extends ProjectListItem {
  readonly siteConfig: unknown
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
  readonly role: string
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
