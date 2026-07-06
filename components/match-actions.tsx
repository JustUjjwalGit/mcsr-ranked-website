import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface MatchActionsProps {
  matchId: string
  playerNickname: string
  vodUrl?: string
  className?: string
}

export function MatchActions({
  matchId,
  playerNickname,
  vodUrl,
  className,
}: MatchActionsProps) {
  const statsUrl = `/stats?player=${encodeURIComponent(playerNickname)}&match=${encodeURIComponent(matchId)}`

  return (
    <span className={cn('inline-flex gap-2', className)}>
      <a
        href={statsUrl}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 sm:flex-none')}
      >
        Stats
      </a>
      {vodUrl && (
        <a
          href={vodUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 sm:flex-none')}
        >
          VOD
        </a>
      )}
    </span>
  )
}
