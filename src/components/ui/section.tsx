import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { useScrollReveal } from '../../hooks/use-scroll-reveal'

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  id: string
  heading?: string
  description?: string
  headerRight?: ReactNode
  animate?: boolean
  stagger?: boolean
}

export function Section({
  id,
  heading,
  description,
  headerRight,
  className,
  children,
  animate = true,
  stagger = false,
  ...props
}: SectionProps) {
  const ref = useScrollReveal<HTMLElement>()

  return (
    <section
      id={id}
      ref={animate ? ref : undefined}
      className={cn('section-card p-8 md:p-10', animate && 'reveal-fade-up', className)}
      {...props}
    >
      {heading && (
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-heading">{heading}</h2>
            {description && <p className="mt-4 text-slate-600 dark:text-slate-400">{description}</p>}
          </div>
          {headerRight}
        </div>
      )}
      {stagger ? <div className="stagger-children">{children}</div> : children}
    </section>
  )
}
