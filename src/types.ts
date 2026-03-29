import type { ReactNode } from 'react'

export type FormState = {
  name: string
  email: string
  message: string
}

export type SampleEntry = {
  slug: string
  title: string
  description: string
  tags?: string[]
  thumbnail?: string
}

export type NewsEntry = {
  slug: string
  title: string
  description: string
  category: string
  date?: string
  href: string
  linkLabel?: string
  body?: ReactNode
}

export type ServiceEntry = {
  slug: string
  title: string
  description: string
  body?: ReactNode
}
