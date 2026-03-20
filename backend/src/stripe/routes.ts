import { Router } from 'express'
import type { Request, Response } from 'express'
import type Stripe from 'stripe'
import { requireAuth } from '../auth/middleware.js'
import type { AuthenticatedRequest } from '../auth/types.js'
import { config } from '../config.js'
import { prisma } from '../db.js'
import { getStripe } from './stripe-client.js'
import { createCheckoutSchema } from './validation.js'
import { notifyUserStatusChange } from '../admin/notifications.js'

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

    // Map tier to price
    const priceId =
      parsed.data.tier === 'starter' ? config.stripePriceStarterMonthly : config.stripePriceProfessionalMonthly

    if (!priceId) return res.status(500).json({ ok: false, error: 'stripe_price_not_configured' })

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
  try {
    const stripe = getStripe()
    const signature = req.headers['stripe-signature'] as string | undefined
    if (!signature || !config.stripeWebhookSecret) {
      return res.status(400).json({ error: 'missing_signature' })
    }

    const event = stripe.webhooks.constructEvent(req.body as Buffer, signature, config.stripeWebhookSecret)

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
    console.error('[stripe] webhook error', err instanceof Error ? err.message : 'unknown')
    return res.status(400).json({ error: 'webhook_error' })
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

  // Create subscription record
  await prisma.subscription.create({
    data: {
      projectId,
      userId,
      stripeSubscriptionId: subscriptionId,
      stripePriceId: subscription.items.data[0]?.price.id ?? null,
      planTier: tier,
      amountCents: tier === 'starter' ? 1900 : 3900,
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
      amountCents: tier === 'starter' ? 1900 : 3900,
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

  // Notify user
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (user) {
    notifyUserStatusChange(user.email, user.name, project.subdomain ?? 'your site', 'Live').catch(() => {})
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = (invoice as unknown as Record<string, unknown>).subscription as string | undefined
  if (!subscriptionId) return

  const sub = await prisma.subscription.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  })
  if (!sub) return

  await prisma.payment.create({
    data: {
      userId: sub.userId,
      projectId: sub.projectId,
      subscriptionId: sub.id,
      amountCents: sub.amountCents,
      currency: 'cad',
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
  }

  console.log(`[stripe] subscription ${stripeSubId} deleted`)
}
