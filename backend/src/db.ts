import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Strip sslmode from URL — pg treats sslmode=require as verify-full
// which rejects self-signed certs. We set ssl explicitly instead.
const dbUrl = (process.env.DATABASE_URL ?? '').replace(/[?&]sslmode=[^&]*/g, '')

// Disable SSL entirely when DATABASE_SSL=false (e.g. local dev without SSL)
const sslConfig =
  process.env.DATABASE_SSL === 'false'
    ? false
    : {
        // Default: verify certs. Set DATABASE_SSL_REJECT_UNAUTHORIZED=false for self-signed (e.g. DigitalOcean Managed)
        rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED !== 'false',
      }

const adapter = new PrismaPg({
  connectionString: dbUrl,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ...(sslConfig !== false && { ssl: sslConfig }),
})

export const prisma = new PrismaClient({ adapter })
