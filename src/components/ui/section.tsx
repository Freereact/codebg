import * as React from 'react'
import { cn } from '../../lib/utils'

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  id: string
  heading?: string
  description?: string
  headerRight?: React.ReactNode
}

export function Section({
  id,
  heading,
  description,
  headerRight,
  className,
  children,
  ...props
}: SectionProps) {
  return (
    <section id={id} className={cn('section-card p-8 md:p-10', className)} {...props}>
      {heading && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-heading">{heading}</h2>
            {description && <p className="mt-4 text-slate-600 dark:text-slate-400">{description}</p>}
          </div>
          {headerRight}
        </div>
      )}
      {children}
    </section>
  )
}
