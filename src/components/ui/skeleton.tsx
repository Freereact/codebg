import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700', className)} />
}

export function SkeletonCard() {
  return (
    <div className="section-card p-5">
      <div className="flex items-start justify-between">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-3 h-4 w-56" />
      <div className="mt-4 flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </div>
    </div>
  )
}

export function SkeletonTemplateCard() {
  return (
    <div className="section-card">
      <Skeleton className="h-32 rounded-b-none rounded-t-[20px]" />
      <div className="p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-2 h-3 w-full" />
        <div className="mt-2 flex gap-1">
          <Skeleton className="h-4 w-12 rounded-full" />
          <Skeleton className="h-4 w-14 rounded-full" />
          <Skeleton className="h-4 w-10 rounded-full" />
        </div>
      </div>
    </div>
  )
}
