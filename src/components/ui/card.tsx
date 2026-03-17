import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const cardVariants = cva(
  'card-hover rounded-2xl border bg-white dark:bg-slate-800 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-slate-200 dark:border-slate-700 p-5',
        featured:
          'border-accent-soft-border bg-gradient-to-br from-accent-soft to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 dark:border-orange-800/50 p-8',
        link: 'border-slate-200 dark:border-slate-700 p-5 hover:border-accent-soft-border',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface CardProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof cardVariants> {
  as?: 'div' | 'article' | 'a'
  href?: string
}

export function Card({
  as: Tag = 'div',
  className,
  variant,
  href,
  ...props
}: CardProps) {
  return (
    <Tag
      className={cn(cardVariants({ variant, className }))}
      {...(Tag === 'a' ? { href } : {})}
      {...props}
    />
  )
}
