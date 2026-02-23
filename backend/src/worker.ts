import amqp from 'amqplib'
import { Redis } from 'ioredis'
import nodemailer from 'nodemailer'
import { config } from './config.js'
import type { EmailJob } from './types.js'

const redis = new Redis(config.redisUrl)
const amqpConn = await amqp.connect(config.rabbitUrl)
const channel = await amqpConn.createChannel()
await channel.assertQueue(config.queueName, { durable: true })

const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com',
  port: 465,
  secure: true,
  auth: {
    user: 'resend',
    pass: config.resendApiKey,
  },
})

channel.consume(config.queueName, async (msg) => {
  if (!msg) return
  const payload = JSON.parse(msg.content.toString()) as EmailJob
  try {
    await transporter.sendMail({
      from: config.mailFrom,
      to: config.mailTo,
      subject: `CodeBG Contact: ${payload.name}`,
      replyTo: payload.email,
      text: `Name: ${payload.name}\nEmail: ${payload.email}\nIP: ${payload.ip}\nUA: ${payload.userAgent}\n\nMessage:\n${payload.message}`,
    })

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
}, { noAck: false })

console.log('codebg-worker started')
