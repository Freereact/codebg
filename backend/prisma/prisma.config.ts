import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { defineConfig } from 'prisma/config'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  earlyAccess: true,
  schema: join(__dirname, 'schema.prisma'),
  migrate: {
    adapter: async () => {
      const { Pool } = await import('pg')
      const { PrismaPg } = await import('@prisma/adapter-pg')
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
      return new PrismaPg(pool)
    },
  },
})
