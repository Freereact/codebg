import { Router } from 'express'
import type { Request, Response } from 'express'
import type Stripe from 'stripe'
import { requireAuth } from '../auth/middleware.js'
import type { AuthenticatedRequest } from '../auth/types.js'
import { config } from '../config.js'
import { prisma } from '../db.js'
import { getStripe } from './stripe-client.js'
import { createCheckoutSchema } from './validation.js'
import {
  notifyUserStatusChange,
  notifyUserPaymentFailed,
  notifyUserSubscriptionCancelled,
  notifyUserSubscriptionCancelScheduled,
  notifyAdminNewPayment,
} from '../admin/notifications.js'

export const checkoutRouter = Router()
export const stripeWebhookRouter = Router()
export const billingRouter = Router()

// ============================================================================
// POST /api/checkout/session — create Stripe Checkout session
// ============================================================================

checkoutRouter.post('/session', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parsed = createCheckoutSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ ok: false, error: 'invalid_payload' })

    const userId = req.user?.sub
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' })

    const project = await prisma.project.findFirst({
      where: { id: parsed.data.projectId, userId, deletedAt: null },
    })
    if (!project) return res.status(404).json({ ok: false, error: 'project_not_found' })
    if (project.planTier) return res.status(400).json({ ok: false, error: 'already_subscribed' })

    const stripe = getStripe()
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return res.status(401).json({ ok: false, error: 'user_not_found' })

    // Get or create Stripe customer
    let stripeCustomerId = user.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { codebg_user_id: userId },
      })
      stripeCustomerId = customer.id
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customer.id } })
    }

    // Map tier to product/price — supports both price_* and prod_* IDs
    const configValue =
      parsed.data.tier === 'starter' ? config.stripePriceStarterMonthly : config.stripePriceProfessionalMonthly

    if (!configValue) return res.status(500).json({ ok: false, error: 'stripe_price_not_configured' })

    let priceId = configValue
    if (configValue.startsWith('prod_')) {
      const product = await stripe.products.retrieve(configValue)
      if (!product.default_price)
        return res.status(500).json({ ok: false, error: 'stripe_product_has_no_default_price' })
      priceId = typeof product.default_price === 'string' ? product.default_price : product.default_price.id
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          codebg_project_id: parsed.data.projectId,
          codebg_user_id: userId,
          tier: parsed.data.tier,
        },
      },
      success_url: `${config.frontendUrl}/portal/dashboard?checkout=success&project=${parsed.data.projectId}`,
      cancel_url: `${config.frontendUrl}/portal/dashboard?checkout=cancelled`,
      metadata: {
        codebg_project_id: parsed.data.projectId,
        codebg_user_id: userId,
        tier: parsed.data.tier,
      },
    })

    return res.json({ ok: true, url: session.url })
  } catch (err) {
    console.error('[stripe] checkout error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// ============================================================================
// POST /api/webhooks/stripe — handle Stripe events
// ============================================================================

stripeWebhookRouter.post('/', async (req: Request, res: Response) => {
  // Step 1: Verify signature — 400 on invalid (Stripe should not retry)
  let event: Stripe.Event
  try {
    const stripe = getStripe()
    const signature = req.headers['stripe-signature'] as string | undefined
    if (!signature || !config.stripeWebhookSecret) {
      return res.status(400).json({ error: 'missing_signature' })
    }
    event = stripe.webhooks.constructEvent(req.body as Buffer, signature, config.stripeWebhookSecret)
  } catch (err) {
    console.error('[stripe] signature verification failed', err instanceof Error ? err.message : 'unknown')
    return res.status(400).json({ error: 'invalid_signature' })
  }

  // Step 2: Handle event — 500 on failure (Stripe will retry)
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object)
        break
      case 'invoice.payment_failed':
        await handleInvoiceFailed(event.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      default:
        console.log(`[stripe] unhandled event: ${event.type}`)
    }

    return res.json({ received: true })
  } catch (err) {
    console.error('[stripe] handler error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ error: 'handler_error' })
  }
})

// ============================================================================
// POST /api/billing/portal — create Stripe Customer Portal session
// ============================================================================

billingRouter.post('/portal', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.sub
    if (!userId) return res.status(401).json({ ok: false, error: 'unauthorized' })

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user?.stripeCustomerId) {
      return res.status(400).json({ ok: false, error: 'no_subscription' })
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${config.frontendUrl}/portal/dashboard`,
    })

    return res.json({ ok: true, url: session.url })
  } catch (err) {
    console.error('[stripe] billing portal error', err instanceof Error ? err.message : 'unknown')
    return res.status(500).json({ ok: false, error: 'internal_error' })
  }
})

// ============================================================================
// Webhook handlers
// ============================================================================

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const metadata = session.metadata as Record<string, string> | undefined
  const projectId = metadata?.codebg_project_id
  const userId = metadata?.codebg_user_id
  const tier = metadata?.tier
  const subscriptionId = session.subscription as string | undefined

  if (!projectId || !userId || !tier || !subscriptionId) {
    console.warn('[stripe] checkout.completed missing metadata')
    return
  }

  // Idempotency: skip if project already live
  const project = await prisma.project.findFirst({ where: { id: projectId, deletedAt: null } })
  if (!project) return
  if (project.status === 'live') return

  const stripe = getStripe()
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // Idempotency: skip if subscription already recorded
  const existingSub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  })
  if (existingSub) {
    console.log(`[stripe] duplicate checkout.completed skipped for ${subscriptionId}`)
    return
  }

  const amountCents = subscription.items.data[0]?.price.unit_amount ?? 0

  // Create subscription record
  await prisma.subscription.create({
    data: {
      projectId,
      userId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      planTier: tier,
      amountCents,
      status: 'active',
      currentPeriodStart: subscription.items.data[0]?.current_period_start
        ? new Date(subscription.items.data[0].current_period_start * 1000)
        : null,
      currentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000)
        : null,
    },
  })

  // Create payment record
  await prisma.payment.create({
    data: {
      userId,
      projectId,
      amountCents,
      currency: 'cad',
      paymentType: 'subscription',
      status: 'succeeded',
      paidAt: new Date(),
    },
  })

  // Update project: preview → live
  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'live', planTier: tier, paidAt: new Date() },
  })

  console.log(`[stripe] project ${projectId} upgraded to ${tier} (live)`)

  // Notify user + admin
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user) {
    notifyUserStatusChange(user.email, user.name, project.subdomain ?? 'your site', 'Live').catch(() => {})
    notifyAdminNewPayment(
      user.email,
      project.subdomain ?? 'project',
      tier,
      `$${(amountCents / 100).toFixed(2)}/mo`,
    ).catch(() => {})
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | undefined
  if (!subscriptionId) return

  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  })
  if (!sub) return

  // Idempotency: skip if we already recorded this invoice
  const stripeInvoiceId = invoice.id ?? null
  if (stripeInvoiceId) {
    const existing = await prisma.payment.findFirst({ where: { stripeInvoiceId } })
    if (existing) {
      console.log(`[stripe] duplicate invoice.paid skipped: ${stripeInvoiceId}`)
      return
    }
  }

  const rawInvoice = invoice as unknown as Record<string, unknown>
  const piRaw = rawInvoice.payment_intent
  const stripePaymentIntentId = typeof piRaw === 'string' ? piRaw : null

  await prisma.payment.create({
    data: {
      userId: sub.userId,
      projectId: sub.projectId,
      subscriptionId: sub.id,
      stripePaymentIntentId,
      stripeInvoiceId,
      amountCents: invoice.amount_paid ?? sub.amountCents,
      currency: (invoice.currency as string) ?? 'cad',
      paymentType: 'subscription',
      status: 'succeeded',
      paidAt: new Date(),
    },
  })

  console.log(`[stripe] invoice paid for subscription ${subscriptionId}`)
}

async function handleInvoiceFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | undefined
  if (!subscriptionId) return

  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  })
  if (!sub) return

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'past_due' },
  })

  console.log(`[stripe] invoice failed for subscription ${subscriptionId}`)

  // Notify user about payment failure
  const user = await prisma.user.findUnique({ where: { id: sub.userId } })
  const project = await prisma.project.findFirst({ where: { id: sub.projectId } })
  if (user && project) {
    notifyUserPaymentFailed(user.email, user.name, project.subdomain ?? 'your site').catch(() => {})
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const stripeSubId = subscription.id as string
  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubId },
  })
  if (!sub) return

  await prisma.subscription.update({
    where: { id: sub.id },
    data: {
      status: subscription.status as string,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      currentPeriodStart: subscription.items.data[0]?.current_period_start
        ? new Date(subscription.items.data[0].current_period_start * 1000)
        : undefined,
      currentPeriodEnd: subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000)
        : undefined,
    },
  })

  console.log(`[stripe] subscription ${stripeSubId} updated: ${subscription.status}`)

  // Notify user if cancellation was scheduled
  if (subscription.cancel_at_period_end && !sub.cancelAtPeriodEnd) {
    const user = await prisma.user.findUnique({ where: { id: sub.userId } })
    const project = await prisma.project.findFirst({ where: { id: sub.projectId } })
    if (user && project) {
      const endDate = subscription.items.data[0]?.current_period_end
        ? new Date(subscription.items.data[0].current_period_end * 1000).toLocaleDateString('en-CA')
        : 'the end of your billing period'
      notifyUserSubscriptionCancelScheduled(user.email, user.name, project.subdomain ?? 'your site', endDate).catch(
        () => {},
      )
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  const stripeSubId = subscription.id as string
  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: stripeSubId },
    include: { project: true },
  })
  if (!sub) return

  await prisma.subscription.update({
    where: { id: sub.id },
    data: { status: 'cancelled', cancelledAt: new Date() },
  })

  if (sub.project) {
    await prisma.project.update({
      where: { id: sub.project.id },
      data: { status: 'cancelled', cancelledAt: new Date() },
    })

    // Clean up custom domain if active
    if (sub.project.domain && sub.project.domainStatus === 'active') {
      const { writeDomainTask } = await import('../projects/domain-service.js')
      await writeDomainTask('remove', sub.project.domain, sub.project.subdomain ?? sub.project.id)
      await prisma.project.update({
        where: { id: sub.project.id },
        data: { domain: null, domainStatus: null, domainError: null },
      })
    }
  }

  console.log(`[stripe] subscription ${stripeSubId} deleted`)

  // Notify user
  const user = await prisma.user.findUnique({ where: { id: sub.userId } })
  if (user && sub.project) {
    notifyUserSubscriptionCancelled(user.email, user.name, sub.project.subdomain ?? 'your site').catch(() => {})
  }
}
