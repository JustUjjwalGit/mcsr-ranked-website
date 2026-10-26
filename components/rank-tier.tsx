'use client'

import { resolveRankTier } from '@/lib/rank-tiers'
import { cn } from '@/lib/utils'

export function RankTierIcon({
  tier,
  elo,
  size = 36,
  className,
}: {
  tier?: string | null
  elo?: number | null
  size?: number
  className?: string
}) {
  const resolved = resolveRankTier(tier, elo)

  return (
    <span
      role="img"
      aria-label={`Official ${resolved.name} rank icon`}
      className={cn(
        'inline-block shrink-0 image-rendering-pixelated',
        className,
      )}
      data-rank-icon={resolved.key}
      style={{
        width: size,
        height: size,
        backgroundImage: "url('/ranks/ranks-divisions.png')",
        backgroundPosition: `${size / 2 - resolved.spriteCenterX}px ${size / 2 - 73}px`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: '480px 270px',
        filter: `drop-shadow(0 0 8px color-mix(in srgb, ${resolved.accent}, transparent 58%))`,
      }}
    />
  )
}

export function RankTier({
  tier,
  elo,
  iconSize = 36,
  className,
}: {
  tier?: string | null
  elo?: number | null
  iconSize?: number
  className?: string
}) {
  const resolved = resolveRankTier(tier, elo)

  return (
    <span
      className={cn(
        'inline-flex min-w-0 items-center gap-2 whitespace-nowrap',
        className,
      )}
      data-rank-tier={resolved.key}
      style={{ color: resolved.accent }}
    >
      <RankTierIcon tier={resolved.label} size={iconSize} />
      <span>{resolved.label}</span>
    </span>
  )
}
