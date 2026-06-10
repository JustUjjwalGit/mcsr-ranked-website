'use client'

import Image from 'next/image'
import { useState } from 'react'
import { getPlayerBodyUrl, placeholderUserPath } from '@/lib/player-avatar'
import { cn } from '@/lib/utils'

interface UserSkinProps {
  uuid?: string | null
  username?: string | null
  size?: number
  className?: string
  priority?: boolean
}

export function UserSkin({
  uuid,
  username,
  size = 256,
  className,
  priority,
}: UserSkinProps) {
  const [src, setSrc] = useState(() => getPlayerBodyUrl(uuid, username, size))

  return (
    <Image
      src={src}
      alt={username ? `${username} full skin` : 'Player full skin'}
      width={size}
      height={size}
      className={cn('object-contain image-rendering-pixelated', className)}
      priority={priority}
      onError={() => setSrc(placeholderUserPath)}
    />
  )
}
