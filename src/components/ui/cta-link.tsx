import { cn } from '../../lib/utils'

export interface CtaLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  arrow?: boolean
}

export function CtaLink({
  className,
  children,
  arrow = true,
  ...props
}: CtaLinkProps) {
  return (
    <a
      className={cn(
        'text-sm font-medium text-accent-text hover:text-accent-text-hover dark:text-orange-400 dark:hover:text-orange-300',
        className,
      )}
      {...props}
    >
      {children}
      {arrow && ' \u2192'}
    </a>
  )
}
