import type { Metadata } from 'next'
import { SITE_NAME } from '@/lib/site'

interface PageMetadataOptions {
  title: string
  description: string
  path: string
}

export function buildPageMetadata({
  title,
  description,
  path,
}: PageMetadataOptions): Metadata {
  const socialTitle = `${title} | ${SITE_NAME}`

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: path,
      siteName: SITE_NAME,
      title: socialTitle,
      description,
      images: [
        {
          url: '/mcsr-ranked-social.png',
          width: 1732,
          height: 908,
          alt: 'MCSR Ranked Tracker – leaderboards, live matches, and player stats',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: ['/mcsr-ranked-social.png'],
    },
  }
}
