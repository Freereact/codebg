import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import amqp from 'amqplib'
import { config } from './config.js'
import { redis } from './redis.js'
import { getSiteMode, siteMaintenanceGuard } from './site-mode.js'
import { emailJobSchema, isAllowedOrigin } from './validation.js'
import { verifyTurnstile } from './turnstile.js'
import { prisma } from './db.js'
import { authRouter, jwtMiddleware } from './auth/index.js'
import { projectsRouter, usersRouter, feedbackRouter } from './projects/index.js'
import { adminRouter } from './admin/index.js'
import { githubWebhookRouter } from './github/index.js'
import { checkoutRouter, stripeWebhookRouter, billingRouter } from './stripe/index.js'
import type { EmailJob } from './types.js'

const app = express()
app.set('trust proxy', 1) // Behind nginx reverse proxy
app.use(helmet())

// Webhook routes MUST receive raw body for signature verification — mount BEFORE express.json()
app.use('/api/hooks', express.raw({ type: 'application/json' }), githubWebhookRouter)
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }), stripeWebhookRouter)

app.use(express.json({ limit: '200kb' }))
app.use(cookieParser())
app.use(
  cors({
    origin: (origin, cb) => cb(null, origin ? isAllowedOrigin(origin, config.allowedOrigins) : false),
    credentials: true,
  }),
)
app.use(jwtMiddleware)
app.use(siteMaintenanceGuard)

let amqpConn: amqp.ChannelModel | null = null
let channel: amqp.Channel | null = null
try {
  amqpConn = await amqp.connect(config.rabbitUrl)
  amqpConn.on('error', (err: Error) => {
    console.error('[amqp] connection error', err)
    channel = null
  })
  amqpConn.on('close', () => {
    console.warn('[amqp] connection closed')
    channel = null
  })
  channel = await amqpConn.createChannel()
  await channel.assertQueue(config.queueName, { durable: true })
  console.log('RabbitMQ queue ready')
} catch (err) {
  console.warn('RabbitMQ unavailable, using direct-send fallback', err)
}

async function sendViaResend(job: EmailJob): Promise<void> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.mailFrom,
      to: [config.mailTo],
      reply_to: job.email,
      subject: `CodeBG Contact: ${job.name}`,
      text: `Name: ${job.name}\nEmail: ${job.email}\nIP: ${job.ip}\nUA: ${job.userAgent}\n\nMessage:\n${job.message}`,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Resend API error (${response.status}): ${errText}`)
  }
}

app.get('/api/site-mode', async (_req, res) => {
  const mode = await getSiteMode()
  return res.json({ ok: true, mode })
})

app.get('/healthz', async (_req, res) => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1')
    await redis.ping()
    res.json({ ok: true })
  } catch {
    res.status(503).json({ ok: false, error: 'unhealthy' })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/projects', projectsRouter)
app.use('/api/users', usersRouter)
app.use('/api/feedback', feedbackRouter)
app.use('/api/admin', adminRouter)
app.use('/api/checkout', checkoutRouter)
app.use('/api/billing', billingRouter)
// Note: /api/hooks and /api/webhooks/stripe are mounted above express.json() for raw body access

app.post('/api/email-job', async (req, res) => {
  const origin = req.headers.origin
  if (!isAllowedOrigin(origin, config.allowedOrigins)) {
    return res.status(403).json({ ok: false, error: 'forbidden_origin' })
  }

  const parsed = emailJobSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: 'invalid_payload', issues: parsed.error.issues })
  }

  const turnstileOk = await verifyTurnstile(config.turnstileSecret, parsed.data.turnstileToken, req.ip)
  if (!turnstileOk) {
    return res.status(400).json({ ok: false, error: 'turnstile_failed' })
  }

  const dateKey = new Date().toISOString().slice(0, 10)
  const limitKey = `email_limit:${dateKey}`
  const count = await redis.incr(limitKey)
  if (count === 1) await redis.expire(limitKey, 60 * 60 * 48)
  if (count > config.maxPerDay) {
    return res.status(429).json({ ok: false, error: 'daily_limit_reached' })
  }

  const jobId = crypto.randomUUID()
  const job: EmailJob = {
    jobId,
    name: parsed.data.name,
    email: parsed.data.email,
    message: parsed.data.message,
    createdAt: new Date().toISOString(),
    ip: req.ip ?? 'unknown',
    userAgent: req.get('user-agent') ?? 'unknown',
  }

  await redis.hset(`email_job:${jobId}`, {
    status: 'queued',
    createdAt: job.createdAt,
    email: job.email,
    name: job.name,
  })

  if (channel) {
    channel.sendToQueue(config.queueName, Buffer.from(JSON.stringify(job)), { persistent: true })
    return res.status(202).json({ ok: true, jobId })
  }

  try {
    await sendViaResend(job)
    await redis.hset(`email_job:${jobId}`, {
      status: 'sent',
      sentAt: new Date().toISOString(),
    })
    return res.status(200).json({ ok: true, jobId, direct: true })
  } catch (error) {
    await redis.hset(`email_job:${jobId}`, {
      status: 'failed',
      failedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'unknown',
    })
    return res.status(502).json({ ok: false, error: 'email_send_failed' })
  }
})

const server = app.listen(config.port, () => {
  console.log(`codebg-api listening on :${config.port}`)
})

let isShuttingDown = false
async function shutdown() {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log('Shutting down gracefully...')
  server.close(async () => {
    try {
      await channel?.close()
    } catch {
      /* already closed */
    }
    try {
      await amqpConn?.close()
    } catch {
      /* already closed */
    }
    try {
      await redis.quit()
    } catch {
      /* already closed */
    }
    try {
      await prisma.$disconnect()
    } catch {
      /* already closed */
    }
    console.log('Shutdown complete')
    process.exit(0)
  })

  // Force exit after 10s if draining takes too long
  setTimeout(() => {
    console.error('Forced shutdown after timeout')
    process.exit(1)
  }, 10_000).unref()
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
