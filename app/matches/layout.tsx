import { buildPageMetadata } from '@/lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Live & Recent MCSR Ranked Matches',
  description:
    'Watch live MCSR Ranked races with both player perspectives, follow real-time progress, and browse recent competitive matches and replays.',
  path: '/matches',
})

export default function MatchesLayout({ children }: { children: React.ReactNode }) {
  return children
}
