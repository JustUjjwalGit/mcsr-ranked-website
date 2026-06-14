'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getPlayerComboUrl, placeholderUserPath } from '@/lib/player-avatar'
import { cn } from '@/lib/utils'

interface UserComboAvatarProps {
  uuid?: string | null
  username?: string | null
  size?: number
  className?: string
  priority?: boolean
}

export function UserComboAvatar({
  uuid,
  username,
  size = 160,
  className,
  priority,
}: UserComboAvatarProps) {
  const [src, setSrc] = useState(() =>
    getPlayerComboUrl(uuid, username, size),
  )

  return (
    <Image
      src={src}
      alt={username ? `${username} combo avatar` : 'Player combo avatar'}
      width={size}
      height={size}
      className={cn('object-contain image-rendering-pixelated', className)}
      priority={priority}
      onError={() => setSrc(placeholderUserPath)}
    />
  )
}
