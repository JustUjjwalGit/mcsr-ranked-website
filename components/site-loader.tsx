import { cn } from '@/lib/utils'

interface SiteLoaderProps {
  label?: string
  className?: string
}

export function SiteLoader({ label = 'Loading...', className }: SiteLoaderProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-5', className)}>
      <div className="loader" aria-hidden="true" />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  )
}
