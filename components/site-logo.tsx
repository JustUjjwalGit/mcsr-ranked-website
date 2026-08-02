import Image from 'next/image'
import { cn } from '@/lib/utils'

const OFFICIAL_SITE_ICON = '/Gold_Icon.png'

interface SiteLogoProps {
  size?: number
  className?: string
  priority?: boolean
}

export function SiteLogo({ size = 48, className, priority }: SiteLogoProps) {
  return (
    <Image
      src={OFFICIAL_SITE_ICON}
      alt="MCSR Ranked"
      width={size}
      height={size}
      className={cn('object-contain [image-rendering:pixelated]', className)}
      priority={priority}
    />
  )
}

export const siteIconPath = OFFICIAL_SITE_ICON
