export type UserRole = 'lead' | 'client' | 'admin'

export interface AuthUser {
  id: string
  email: string
  role: UserRole
}

export type AuthState =
  | { status: 'loading' }
  | { status: 'unauthenticated' }
  | { status: 'authenticated'; user: AuthUser }
