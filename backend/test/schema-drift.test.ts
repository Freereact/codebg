import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

/**
 * Verify that the SQL migration and Prisma schema define the same columns
 * for critical tables. This catches drift between the two sources of truth.
 */
describe('schema drift: SQL migration vs Prisma schema', () => {
  const migrationSql = readFileSync(join(__dirname, '../migrations/001_initial_schema.sql'), 'utf-8')
  const prismaSchema = readFileSync(join(__dirname, '../prisma/schema.prisma'), 'utf-8')

  it('projects table has github_url column in SQL migration', () => {
    // The Prisma schema maps githubUrl → github_url
    expect(prismaSchema).toContain('githubUrl')
    expect(prismaSchema).toContain('@map("github_url")')

    // The SQL migration must also define this column
    expect(migrationSql).toContain('github_url')
  })

  it('projects table columns in SQL match Prisma schema mapped names', () => {
    // Extract @map("...") values from Prisma Project model
    const projectModelMatch = prismaSchema.match(/model Project \{([\s\S]*?)^\}/m)
    expect(projectModelMatch).not.toBeNull()

    const projectModel = projectModelMatch![1]
    const mappedColumns = [...projectModel.matchAll(/@map\("(\w+)"\)/g)].map((m) => m[1])

    // Also include columns that are NOT mapped (field name = column name)
    const unmappedFields = [...projectModel.matchAll(/^\s+(\w+)\s+\w+/gm)]
      .map((m) => m[1])
      .filter((f) => !['id', 'user', 'subscriptions', 'payments', 'contentRequests', 'adminNotes'].includes(f))

    // Key columns that MUST exist in the migration
    const criticalColumns = [
      'template_slug',
      'site_config',
      'domain',
      'subdomain',
      'github_url',
      'status',
      'setup_fee_cents',
      'plan_tier',
      'paid_at',
      'deleted_at',
    ]

    for (const col of criticalColumns) {
      expect(migrationSql, `SQL migration missing column: ${col}`).toContain(col)
    }
  })

  it('users table has stripe_customer_id in both SQL and Prisma', () => {
    expect(prismaSchema).toContain('@map("stripe_customer_id")')
    expect(migrationSql).toContain('stripe_customer_id')
  })

  it('subscriptions table has stripe_subscription_id in both SQL and Prisma', () => {
    expect(prismaSchema).toContain('@map("stripe_subscription_id")')
    expect(migrationSql).toContain('stripe_subscription_id')
  })

  it('payments table has stripe_payment_intent_id in both SQL and Prisma', () => {
    expect(prismaSchema).toContain('@map("stripe_payment_intent_id")')
    expect(migrationSql).toContain('stripe_payment_intent_id')
  })

  it('payments table has stripe_invoice_id in both SQL and Prisma', () => {
    expect(prismaSchema).toContain('@map("stripe_invoice_id")')
    expect(migrationSql).toContain('stripe_invoice_id')
  })
})
