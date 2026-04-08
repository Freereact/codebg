/**
 * One-time data migration: convert existing ContentRequest description + adminResponse
 * into Message rows so every feedback item has a proper conversation thread.
 *
 * Run with: npx tsx scripts/migrate-feedback-to-messages.ts
 *
 * Safe to re-run — skips feedback items that already have messages.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrate() {
  // Find the admin user (for attributing admin responses)
  const admin = await prisma.user.findFirst({ where: { role: 'admin' } })
  if (!admin) {
    console.error('No admin user found. Create one first.')
    process.exit(1)
  }
  console.log(`Using admin user: ${admin.email} (${admin.id})`)

  // Find all content requests
  const requests = await prisma.contentRequest.findMany({
    orderBy: { createdAt: 'asc' },
  })
  console.log(`Found ${requests.length} content requests`)

  let created = 0
  let skipped = 0

  for (const req of requests) {
    // Check if messages already exist for this thread
    const existing = await prisma.message.count({ where: { contentRequestId: req.id } })
    if (existing > 0) {
      skipped++
      continue
    }

    // Create the customer's original message from the description
    await prisma.message.create({
      data: {
        contentRequestId: req.id,
        authorId: req.userId,
        authorRole: 'client',
        body: req.description,
        readAt: req.createdAt, // admin has seen it
        createdAt: req.createdAt,
      },
    })
    created++

    // Create the admin response message if it exists
    if (req.adminResponse) {
      await prisma.message.create({
        data: {
          contentRequestId: req.id,
          authorId: admin.id,
          authorRole: 'admin',
          body: req.adminResponse,
          readAt: req.updatedAt, // customer has seen it (got email)
          createdAt: req.updatedAt,
        },
      })
      created++
    }
  }

  console.log(`Migration complete: ${created} messages created, ${skipped} threads skipped (already had messages)`)
  await prisma.$disconnect()
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
