import crypto from 'node:crypto'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import amqp from 'amqplib'
import { Redis } from 'ioredis'
import { config } from './config.js'
import { emailJobSchema, isAllowedOrigin } from './validation.js'
import { verifyTurnstile } from './turnstile.js'
import type { EmailJob } from './types.js'

const app = express()
app.use(helmet())
app.use(express.json({ limit: '200kb' }))
app.use(cors({
  origin: (origin, cb) => cb(null, origin ? isAllowedOrigin(origin, config.allowedOrigins) : false),
  credentials: false,
}))

const redis = new Redis(config.redisUrl)
let channel: amqp.Channel | null = null
try {
  const amqpConn = await amqp.connect(config.rabbitUrl)
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
  })

  if (!response.ok) {
    const errText = await response.text()
    throw new Error(`Resend API error (${response.status}): ${errText}`)
  }
}

app.get('/healthz', (_req, res) => {
  res.json({ ok: true })
})

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
    ip: req.ip ?? "unknown",
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

app.listen(config.port, () => {
  console.log(`codebg-api listening on :${config.port}`)
})
