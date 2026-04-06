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
  sampleAppsDir: required('SAMPLE_APPS_DIR'),
  buildRateLimitSeconds: Number(process.env.BUILD_RATE_LIMIT_SECONDS ?? 300),
  ghAppId: process.env.GH_APP_ID ?? '',
  ghAppPrivateKey: process.env.GH_APP_PRIVATE_KEY
    ? Buffer.from(process.env.GH_APP_PRIVATE_KEY, 'base64').toString('utf-8')
    : '',
  ghAppInstallationId: Number(process.env.GH_APP_INSTALLATION_ID ?? '0'),
  ghWebhookSecret: process.env.GH_WEBHOOK_SECRET ?? '',
  ghOrg: process.env.GH_ORG ?? '',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  stripePriceStarterMonthly: process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '',
  stripePriceProfessionalMonthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY ?? '',
  get stripeConfigured(): boolean {
    return !!(this.stripeSecretKey && this.stripeWebhookSecret)
  },
}

// Warn at startup about missing optional config
if (!config.stripeSecretKey) console.warn('[config] STRIPE_SECRET_KEY not set — checkout will fail')
if (!config.stripeWebhookSecret) console.warn('[config] STRIPE_WEBHOOK_SECRET not set — webhooks will fail')
if (!config.stripePriceStarterMonthly) console.warn('[config] STRIPE_PRICE_STARTER_MONTHLY not set')
if (!config.stripePriceProfessionalMonthly) console.warn('[config] STRIPE_PRICE_PROFESSIONAL_MONTHLY not set')
