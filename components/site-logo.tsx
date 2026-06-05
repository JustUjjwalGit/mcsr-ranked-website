import Image from 'next/image'
import { cn } from '@/lib/utils'

const GOLD_ICON = '/Gold_Icon.png'

interface SiteLogoProps {
  size?: number
  className?: string
  priority?: boolean
}

export function SiteLogo({ size = 48, className, priority }: SiteLogoProps) {
  return (
    <Image
      src={GOLD_ICON}
      alt="MCSR Ranked"
      width={size}
      height={size}
      className={cn('object-contain', className)}
      priority={priority}
    />
  )
}

export const siteIconPath = GOLD_ICON
