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
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  frontendUrl: required('FRONTEND_URL'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  magicLinkExpiryMinutes: Number(process.env.MAGIC_LINK_EXPIRY_MINUTES ?? 15),
  projectsDir: process.env.PROJECTS_DIR ?? '/var/www/projects',
  sitesDir: process.env.SITES_DIR ?? '/var/www/sites',
  sampleAppsDir: process.env.SAMPLE_APPS_DIR ?? '/home/sz-server/projects/codebg/sample-apps',
  buildRateLimitSeconds: Number(process.env.BUILD_RATE_LIMIT_SECONDS ?? 300),
}
