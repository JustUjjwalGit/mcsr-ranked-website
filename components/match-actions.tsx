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
  const statsUrl = `https://mcsrranked.com/stats/${encodeURIComponent(playerNickname)}/${matchId}`
  const href = vodUrl || statsUrl
  const label = vodUrl ? 'Watch VOD' : 'View Match'

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), className)}
    >
      {label}
    </a>
  )
}
