import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Strip sslmode from URL — pg treats sslmode=require as verify-full
// which rejects DO managed Postgres self-signed certs.
// We set ssl explicitly with rejectUnauthorized: false instead.
const dbUrl = (process.env.DATABASE_URL ?? '').replace(/[?&]sslmode=[^&]*/g, '')

const adapter = new PrismaPg({
  connectionString: dbUrl,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
  ssl: { rejectUnauthorized: false },
})

export const prisma = new PrismaClient({ adapter })
