import Image from 'next/image'
import { cn } from '@/lib/utils'
import {
  getMcsrRank,
  getMcsrRankAsset,
  getMcsrRankFromName,
} from '@/lib/mcsr-rank'

export function RankIcon({
  elo,
  tier,
  size = 28,
  className,
}: {
  elo?: number | null
  tier?: string
  size?: number
  className?: string
}) {
  const rank = getMcsrRank(elo) ?? (tier ? getMcsrRankFromName(tier) : null)
  const label = rank ? rank.fullName : 'Unrated'

  return (
    <Image
      src={getMcsrRankAsset(rank)}
      alt={label}
      title={label}
      width={size}
      height={size}
      unoptimized
      className={cn('inline-block shrink-0 object-contain', className)}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
    />
  )
}
