import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface CarouselProps {
  children: ReactNode[]
  autoPlay?: boolean
  interval?: number
  showDots?: boolean
  showArrows?: boolean
  className?: string
  slideClassName?: string
}

export function Carousel({
  children,
  autoPlay = true,
  interval = 5000,
  showDots = true,
  showArrows = true,
  className,
  slideClassName,
}: CarouselProps) {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const total = children.length
  const timerRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const goTo = useCallback(
    (idx: number) => {
      setCurrent(((idx % total) + total) % total)
    },
    [total],
  )

  const next = useCallback(() => goTo(current + 1), [current, goTo])
  const prev = useCallback(() => goTo(current - 1), [current, goTo])

  useEffect(() => {
    if (!autoPlay || paused || total <= 1) return
    timerRef.current = setInterval(next, interval)
    return () => clearInterval(timerRef.current)
  }, [autoPlay, paused, interval, next, total])

  if (total === 0) return null

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {children.map((child, i) => (
          <div key={i} className={cn('w-full flex-shrink-0', slideClassName)}>
            {child}
          </div>
        ))}
      </div>

      {showArrows && total > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-slate-800/90 p-1.5 shadow-md backdrop-blur-sm transition-opacity hover:opacity-80"
            aria-label="Previous slide"
          >
            <ChevronLeft size={18} className="text-slate-700 dark:text-slate-200" />
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 dark:bg-slate-800/90 p-1.5 shadow-md backdrop-blur-sm transition-opacity hover:opacity-80"
            aria-label="Next slide"
          >
            <ChevronRight size={18} className="text-slate-700 dark:text-slate-200" />
          </button>
        </>
      )}

      {showDots && total > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {children.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === current ? 'w-6 bg-accent' : 'w-2 bg-slate-300 dark:bg-slate-600',
              )}
            />
          ))}
        </div>
      )}
    </div>
  )
}
