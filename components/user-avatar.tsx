'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getPlayerAvatarUrl, placeholderUserPath } from '@/lib/player-avatar'
import { cn } from '@/lib/utils'

interface UserAvatarProps {
  uuid?: string | null
  username?: string | null
  size?: number
  className?: string
  priority?: boolean
}

export function UserAvatar({
  uuid,
  username,
  size = 80,
  className,
  priority,
}: UserAvatarProps) {
  const [src, setSrc] = useState(() =>
    getPlayerAvatarUrl(uuid, username, size),
  )

  return (
    <Image
      src={src}
      alt={username ? `${username} avatar` : 'Player avatar'}
      width={size}
      height={size}
      className={cn(
        'rounded-full object-cover bg-muted image-rendering-pixelated',
        className,
      )}
      priority={priority}
      onError={() => setSrc(placeholderUserPath)}
    />
  )
}

export { placeholderUserPath }
