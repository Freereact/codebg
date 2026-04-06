import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'
import { prisma } from '../db.js'
import { config } from '../config.js'
import type { JwtPayload, UserRole } from './types.js'

export async function findOrCreateUser(email: string): Promise<{ id: string; email: string; role: UserRole }> {
  const normalizedEmail = email.toLowerCase().trim()

  const existing = await prisma.user.findFirst({
    where: { email: normalizedEmail, deletedAt: null },
  })

  if (existing) {
    return { id: existing.id, email: existing.email, role: existing.role as UserRole }
  }

  const created = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      role: 'lead',
    },
  })

  return { id: created.id, email: created.email, role: created.role as UserRole }
}

/**
 * Creates a magic link token AND sends the email atomically.
 * If email fails, the token is deleted so no orphaned tokens remain.
 */
export async function createAndSendMagicLink(userId: string, email: string): Promise<void> {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const expiresAt = new Date(Date.now() + config.magicLinkExpiryMinutes * 60 * 1000)

  const authToken = await prisma.authToken.create({
    data: { userId, tokenHash, expiresAt },
  })

  try {
    await sendMagicLinkEmail(email, rawToken)
  } catch (err) {
    // Clean up orphaned token on email failure
    await prisma.authToken.delete({ where: { id: authToken.id } }).catch(() => {})
    throw err
  }
}

/**
 * Atomically verifies and consumes a magic link token.
 * Uses updateMany with a WHERE filter to prevent TOCTOU race conditions.
 */
export async function verifyMagicLinkToken(
  rawToken: string,
): Promise<{ userId: string; email: string; role: UserRole } | null> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  // Atomic: only updates if token exists, is unused, and not expired
  const result = await prisma.authToken.updateMany({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  })

  if (result.count === 0) return null

  const authToken = await prisma.authToken.findUnique({
    where: { tokenHash },
    include: { user: true },
  })

  if (!authToken) return null

  return {
    userId: authToken.user.id,
    email: authToken.user.email,
    role: authToken.user.role as UserRole,
  }
}

export function signJwt(payload: JwtPayload): string {
  const opts: SignOptions = {
    algorithm: 'HS256',
    expiresIn: config.jwtExpiresIn as SignOptions['expiresIn'],
  }
  return jwt.sign(payload, config.jwtSecret, opts)
}

export function verifyJwt(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] })
    if (typeof decoded === 'string' || !decoded) return null
    if (!('sub' in decoded) || !('email' in decoded) || !('role' in decoded)) return null
    return decoded as JwtPayload
  } catch {
    return null
  }
}

async function sendMagicLinkEmail(email: string, rawToken: string): Promise<void> {
  const link = `${config.frontendUrl}/verify?token=${rawToken}`

  // In local dev, log the link so you can sign in without a real email service
  if (config.resendApiKey.startsWith('re_test') || !config.resendApiKey) {
    console.log(`\n[auth] ✉ Magic link for ${email}:\n  ${link}\n`)
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.mailFrom,
      to: [email],
      subject: 'Sign in to CodeBG',
      text: `Click to sign in:\n\n${config.frontendUrl}/verify?token=${rawToken}\n\nExpires in ${config.magicLinkExpiryMinutes} minutes.`,
    }),
    signal: AbortSignal.timeout(10_000),
  })

  if (!response.ok) {
    const status = response.status
    throw new Error(`Resend API error (${status})`)
  }
}
