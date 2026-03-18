import amqp from 'amqplib'
import { Redis } from 'ioredis'
import { config } from './config.js'
import type { EmailJob } from './types.js'

const redis = new Redis(config.redisUrl)
redis.on('error', (err) => console.error('[redis] connection error', err))

const amqpConn = await amqp.connect(config.rabbitUrl)
amqpConn.on('error', (err) => console.error('[amqp] connection error', err))
amqpConn.on('close', () => console.warn('[amqp] connection closed'))

const channel = await amqpConn.createChannel()
await channel.assertQueue(config.queueName, { durable: true })

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

channel.consume(
  config.queueName,
  async (msg) => {
    if (!msg) return
    const payload = JSON.parse(msg.content.toString()) as EmailJob
    try {
      await sendViaResend(payload)

      await redis.hset(`email_job:${payload.jobId}`, {
        status: 'sent',
        sentAt: new Date().toISOString(),
      })

      channel.ack(msg)
    } catch (error) {
      await redis.hset(`email_job:${payload.jobId}`, {
        status: 'failed',
        failedAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'unknown',
      })
      channel.nack(msg, false, false)
    }
  },
  { noAck: false },
)

console.log('codebg-worker started')

let isShuttingDown = false
async function shutdown() {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log('Worker shutting down gracefully...')

  // Force exit after 10s if draining takes too long
  setTimeout(() => {
    console.error('Worker forced shutdown after timeout')
    process.exit(1)
  }, 10_000).unref()

  try {
    await channel.close()
  } catch {
    /* already closed */
  }
  try {
    await amqpConn.close()
  } catch {
    /* already closed */
  }
  try {
    await redis.quit()
  } catch {
    /* already closed */
  }
  console.log('Worker shutdown complete')
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
