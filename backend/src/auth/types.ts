import type { Request } from 'express'

export type UserRole = 'lead' | 'client' | 'admin'

export interface JwtPayload {
  sub: string // user id
  email: string
  role: UserRole
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}
