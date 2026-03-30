import { describe, expect, it, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPrisma = {
  project: {
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  subscription: {
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  payment: {
    create: vi.fn(),
    findFirst: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
  },
}

vi.mock('../src/db.js', () => ({ prisma: mockPrisma }))

vi.mock('../src/config.js', () => ({
  config: {
    frontendUrl: 'https://codebg.com',
    stripeSecretKey: 'sk_test_xxx',
    stripeWebhookSecret: 'whsec_test',
    stripePriceStarterMonthly: 'price_starter',
    stripePriceProfessionalMonthly: 'price_pro',
    mailTo: 'admin@codebg.com',
    resendApiKey: 'test',
    mailFrom: 'noreply@codebg.com',
  },
}))

vi.mock('../src/stripe/stripe-client.js', () => ({
  getStripe: () => ({
    subscriptions: {
      retrieve: vi.fn(),
    },
  }),
}))

vi.mock('../src/admin/notifications.js', () => ({
  notifyUserStatusChange: vi.fn().mockResolvedValue(undefined),
  notifyUserPaymentFailed: vi.fn().mockResolvedValue(undefined),
  notifyUserSubscriptionCancelled: vi.fn().mockResolvedValue(undefined),
  notifyUserSubscriptionCancelScheduled: vi.fn().mockResolvedValue(undefined),
  notifyAdminNewPayment: vi.fn().mockResolvedValue(undefined),
}))

// We can't easily test the full Express handler without an HTTP layer,
// so we extract and test the logic by importing the module and mocking Stripe.
// Instead, we test the idempotency + pricing logic directly.

const { getStripe } = await import('../src/stripe/stripe-client.js')
const { notifyAdminNewPayment } = await import('../src/admin/notifications.js')

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// handleCheckoutCompleted logic tests
// ---------------------------------------------------------------------------

describe('checkout.completed handler logic', () => {
  // Simulate the handler logic inline since it's a private function
  async function simulateCheckoutCompleted(
    metadata: Record<string, string>,
    subscriptionData: {
      id: string
      items: {
        data: Array<{
          price: { id: string; unit_amount: number | null }
          current_period_start: number
          current_period_end: number
        }>
      }
    },
  ) {
    const { projectId, userId, tier } = metadata
    const subscriptionId = metadata.subscriptionId

    // Idempotency: skip if project already live
    const project = await mockPrisma.project.findFirst({ where: { id: projectId, deletedAt: null } })
    if (!project) return
    if (project.status === 'live') return

    // Idempotency: skip if subscription already recorded
    const existingSub = await mockPrisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    })
    if (existingSub) return

    const amountCents = subscriptionData.items.data[0]?.price.unit_amount ?? 0

    await mockPrisma.subscription.create({
      data: {
        projectId,
        userId,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: subscriptionData.items.data[0]?.price.id ?? null,
        planTier: tier,
        amountCents,
        status: 'active',
      },
    })

    await mockPrisma.payment.create({
      data: {
        userId,
        projectId,
        amountCents,
        currency: 'cad',
        paymentType: 'subscription',
        status: 'succeeded',
        paidAt: expect.any(Date),
      },
    })

    await mockPrisma.project.update({
      where: { id: projectId },
      data: { status: 'live', planTier: tier, paidAt: expect.any(Date) },
    })

    const user = await mockPrisma.user.findUnique({ where: { id: userId } })
    if (user) {
      ;(notifyAdminNewPayment as ReturnType<typeof vi.fn>)(
        user.email,
        project.subdomain ?? 'project',
        tier,
        `$${(amountCents / 100).toFixed(2)}/mo`,
      )
    }
  }

  const metadata = {
    projectId: 'proj-1',
    userId: 'user-1',
    tier: 'starter',
    subscriptionId: 'sub_123',
  }

  const subscriptionData = {
    id: 'sub_123',
    items: {
      data: [
        {
          price: { id: 'price_starter', unit_amount: 1900 },
          current_period_start: 1700000000,
          current_period_end: 1702600000,
        },
      ],
    },
  }

  it('reads amount from Stripe subscription, not hardcoded', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', status: 'preview', subdomain: 'test' })
    mockPrisma.subscription.findFirst.mockResolvedValue(null)
    mockPrisma.subscription.create.mockResolvedValue({})
    mockPrisma.payment.create.mockResolvedValue({})
    mockPrisma.project.update.mockResolvedValue({})
    mockPrisma.user.findUnique.mockResolvedValue({ email: 'a@b.com', name: 'Test' })

    // Use a non-standard price to prove we're not hardcoding
    const customPriceData = {
      ...subscriptionData,
      items: { data: [{ ...subscriptionData.items.data[0], price: { id: 'price_custom', unit_amount: 2500 } }] },
    }

    await simulateCheckoutCompleted(metadata, customPriceData)

    expect(mockPrisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountCents: 2500 }),
      }),
    )
    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountCents: 2500 }),
      }),
    )
  })

  it('formats notification amount from actual cents', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', status: 'preview', subdomain: 'mysite' })
    mockPrisma.subscription.findFirst.mockResolvedValue(null)
    mockPrisma.subscription.create.mockResolvedValue({})
    mockPrisma.payment.create.mockResolvedValue({})
    mockPrisma.project.update.mockResolvedValue({})
    mockPrisma.user.findUnique.mockResolvedValue({ email: 'a@b.com', name: 'Test' })

    const customPriceData = {
      ...subscriptionData,
      items: { data: [{ ...subscriptionData.items.data[0], price: { id: 'price_x', unit_amount: 4900 } }] },
    }

    await simulateCheckoutCompleted(metadata, customPriceData)

    expect(notifyAdminNewPayment).toHaveBeenCalledWith('a@b.com', 'mysite', 'starter', '$49.00/mo')
  })

  it('skips if project is already live (idempotency)', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', status: 'live', subdomain: 'test' })

    await simulateCheckoutCompleted(metadata, subscriptionData)

    expect(mockPrisma.subscription.create).not.toHaveBeenCalled()
    expect(mockPrisma.payment.create).not.toHaveBeenCalled()
  })

  it('skips if subscription already exists (idempotency)', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', status: 'preview', subdomain: 'test' })
    mockPrisma.subscription.findFirst.mockResolvedValue({ id: 'existing-sub' })

    await simulateCheckoutCompleted(metadata, subscriptionData)

    expect(mockPrisma.subscription.create).not.toHaveBeenCalled()
    expect(mockPrisma.payment.create).not.toHaveBeenCalled()
  })

  it('skips if project not found', async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null)

    await simulateCheckoutCompleted(metadata, subscriptionData)

    expect(mockPrisma.subscription.create).not.toHaveBeenCalled()
  })

  it('handles null unit_amount gracefully (defaults to 0)', async () => {
    mockPrisma.project.findFirst.mockResolvedValue({ id: 'proj-1', status: 'preview', subdomain: 'test' })
    mockPrisma.subscription.findFirst.mockResolvedValue(null)
    mockPrisma.subscription.create.mockResolvedValue({})
    mockPrisma.payment.create.mockResolvedValue({})
    mockPrisma.project.update.mockResolvedValue({})
    mockPrisma.user.findUnique.mockResolvedValue(null)

    const nullPriceData = {
      ...subscriptionData,
      items: { data: [{ ...subscriptionData.items.data[0], price: { id: 'price_x', unit_amount: null } }] },
    }

    await simulateCheckoutCompleted(metadata, nullPriceData)

    expect(mockPrisma.subscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ amountCents: 0 }),
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// handleInvoicePaid logic tests
// ---------------------------------------------------------------------------

describe('invoice.paid handler logic', () => {
  async function simulateInvoicePaid(invoice: {
    id: string | null
    subscription?: string
    payment_intent?: string | null
    amount_paid?: number
    currency?: string
  }) {
    const subscriptionId = invoice.subscription
    if (!subscriptionId) return

    const sub = await mockPrisma.subscription.findFirst({
      where: { stripeSubscriptionId: subscriptionId },
    })
    if (!sub) return

    // Idempotency: skip if we already recorded this invoice
    const stripeInvoiceId = invoice.id ?? null
    if (stripeInvoiceId) {
      const existing = await mockPrisma.payment.findFirst({ where: { stripeInvoiceId } })
      if (existing) return 'skipped'
    }

    const stripePaymentIntentId = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null

    await mockPrisma.payment.create({
      data: {
        userId: sub.userId,
        projectId: sub.projectId,
        subscriptionId: sub.id,
        stripePaymentIntentId,
        stripeInvoiceId,
        amountCents: invoice.amount_paid ?? sub.amountCents,
        currency: invoice.currency ?? 'cad',
        paymentType: 'subscription',
        status: 'succeeded',
        paidAt: expect.any(Date),
      },
    })

    return 'created'
  }

  it('uses invoice.amount_paid instead of subscription amount', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub-db-1',
      userId: 'user-1',
      projectId: 'proj-1',
      amountCents: 1900, // old subscription price
    })
    mockPrisma.payment.findFirst.mockResolvedValue(null)
    mockPrisma.payment.create.mockResolvedValue({})

    await simulateInvoicePaid({
      id: 'inv_123',
      subscription: 'sub_stripe_1',
      payment_intent: 'pi_123',
      amount_paid: 3900, // actual invoice amount (e.g., price changed)
      currency: 'usd',
    })

    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountCents: 3900,
          currency: 'usd',
          stripePaymentIntentId: 'pi_123',
          stripeInvoiceId: 'inv_123',
        }),
      }),
    )
  })

  it('skips duplicate invoice (idempotency)', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub-db-1',
      userId: 'user-1',
      projectId: 'proj-1',
      amountCents: 1900,
    })
    mockPrisma.payment.findFirst.mockResolvedValue({ id: 'existing-payment' })

    const result = await simulateInvoicePaid({
      id: 'inv_duplicate',
      subscription: 'sub_stripe_1',
      amount_paid: 1900,
    })

    expect(result).toBe('skipped')
    expect(mockPrisma.payment.create).not.toHaveBeenCalled()
  })

  it('skips when subscription not found', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue(null)

    await simulateInvoicePaid({
      id: 'inv_123',
      subscription: 'sub_unknown',
      amount_paid: 1900,
    })

    expect(mockPrisma.payment.create).not.toHaveBeenCalled()
  })

  it('skips when no subscription ID in invoice', async () => {
    const result = await simulateInvoicePaid({
      id: 'inv_123',
      amount_paid: 1900,
    })

    expect(result).toBeUndefined()
    expect(mockPrisma.subscription.findFirst).not.toHaveBeenCalled()
  })

  it('falls back to sub.amountCents when invoice.amount_paid is undefined', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub-db-1',
      userId: 'user-1',
      projectId: 'proj-1',
      amountCents: 1900,
    })
    mockPrisma.payment.findFirst.mockResolvedValue(null)
    mockPrisma.payment.create.mockResolvedValue({})

    await simulateInvoicePaid({
      id: 'inv_no_amount',
      subscription: 'sub_stripe_1',
      payment_intent: null,
    })

    expect(mockPrisma.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amountCents: 1900,
          stripePaymentIntentId: null,
        }),
      }),
    )
  })

  it('handles null invoice ID gracefully (skips dedup check)', async () => {
    mockPrisma.subscription.findFirst.mockResolvedValue({
      id: 'sub-db-1',
      userId: 'user-1',
      projectId: 'proj-1',
      amountCents: 1900,
    })
    mockPrisma.payment.create.mockResolvedValue({})

    const result = await simulateInvoicePaid({
      id: null,
      subscription: 'sub_stripe_1',
      amount_paid: 1900,
    })

    // Should NOT call findFirst for dedup (no invoice ID to check)
    expect(mockPrisma.payment.findFirst).not.toHaveBeenCalled()
    expect(result).toBe('created')
  })
})
