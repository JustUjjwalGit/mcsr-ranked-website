import { ExternalLink } from 'lucide-react'
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
    <span className={cn('inline-flex flex-wrap gap-2', className)}>
      <a
        href={statsUrl}
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 sm:flex-none')}
      >
        Stats
      </a>
      <a
        href={`https://ranked.mcsr.in/match/${matchId}`}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'flex-1 sm:flex-none gap-1.5')}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        Official Stats
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

