import dotenv from 'dotenv'
dotenv.config()

function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var: ${name}`)
  return value
}

export const config = {
  port: Number(process.env.PORT ?? 8787),
  redisUrl: required('REDIS_URL'),
  rabbitUrl: required('RABBITMQ_URL'),
  queueName: process.env.RABBITMQ_QUEUE ?? 'email_jobs',
  turnstileSecret: required('TURNSTILE_SECRET_KEY'),
  resendApiKey: required('RESEND_API_KEY'),
  mailFrom: required('MAIL_FROM'),
  mailTo: required('MAIL_TO'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'https://codebg.com').split(',').map((s) => s.trim()),
  maxPerDay: Number(process.env.MAX_EMAILS_PER_DAY ?? 100),
}
