import { apiFetch } from './api'

export async function createCheckoutSession(
  projectId: string,
  tier: 'starter' | 'professional',
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  return apiFetch('/api/checkout/session', {
    method: 'POST',
    body: JSON.stringify({ projectId, tier }),
  })
}

export async function createBillingPortalSession(): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  return apiFetch('/api/billing/portal', { method: 'POST' })
}
