import type { MetadataRoute } from 'next'
import { INDEXABLE_ROUTES, SITE_URL } from '@/lib/site'

const lastModified = new Date('2026-08-03T00:00:00.000Z')

const routeSettings: Record<
  (typeof INDEXABLE_ROUTES)[number],
  Pick<MetadataRoute.Sitemap[number], 'changeFrequency' | 'priority'>
> = {
  '/': { changeFrequency: 'daily', priority: 1 },
  '/players': { changeFrequency: 'daily', priority: 0.9 },
  '/matches': { changeFrequency: 'hourly', priority: 0.9 },
  '/stats': { changeFrequency: 'daily', priority: 0.8 },
  '/improve': { changeFrequency: 'weekly', priority: 0.8 },
  '/versus': { changeFrequency: 'weekly', priority: 0.7 },
  '/seed-finder': { changeFrequency: 'weekly', priority: 0.7 },
  '/ninjabrain': { changeFrequency: 'monthly', priority: 0.6 },
}

export default function sitemap(): MetadataRoute.Sitemap {
  return INDEXABLE_ROUTES.map((route) => ({
    url: new URL(route, SITE_URL).toString(),
    lastModified,
    ...routeSettings[route],
  }))
}
