import { useState } from 'react'
import { useAuth } from '../hooks/use-auth'
import { Button } from '../components/ui/button'
import { createBillingPortalSession } from '../lib/stripe-api'

export function PortalSettingsPage() {
  const { state: authState } = useAuth()
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState('')

  const email = authState.status === 'authenticated' ? authState.user.email : ''

  const handleManageBilling = async () => {
    setBillingError('')
    setBillingLoading(true)
    try {
      const res = await createBillingPortalSession()
      if (res.ok) {
        window.location.href = res.url
      } else {
        setBillingError(
          res.error === 'no_active_subscription'
            ? 'No active subscription found.'
            : 'Could not open billing portal. Please try again.',
        )
      }
    } catch {
      setBillingError('Network error. Please try again.')
    } finally {
      setBillingLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800 dark:text-white">Account settings</h1>

      <div className="section-card space-y-6 p-6">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Email</p>
          <p className="mt-1 text-slate-800 dark:text-white">{email}</p>
        </div>

        <div className="border-t border-slate-200 pt-6 dark:border-slate-700">
          <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-white">Billing</h2>
          <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
            Manage your subscription, update payment methods, or view invoices.
          </p>
          <Button onClick={handleManageBilling} disabled={billingLoading}>
            {billingLoading ? 'Opening...' : 'Manage billing'}
          </Button>
          {billingError && (
            <p role="alert" className="mt-2 text-sm text-red-500 dark:text-red-400">
              {billingError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
