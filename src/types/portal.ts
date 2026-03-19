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
