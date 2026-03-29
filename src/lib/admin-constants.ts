import type { ProjectStatus } from '../types/portal'

export function getStatusLabel(status: string): string {
  return PROJECT_STATUS_LABELS[status as ProjectStatus] ?? status
}

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
