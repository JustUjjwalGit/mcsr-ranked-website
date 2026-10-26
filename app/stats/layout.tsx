import { buildPageMetadata } from '@/lib/metadata'

export const metadata = buildPageMetadata({
  title: 'MCSR Ranked Player & Global Statistics',
  description:
    'Explore MCSR Ranked activity, Elo and rank distributions, season data, and detailed statistics for Minecraft speedrunning competitors.',
  path: '/stats',
})

export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return children
}
