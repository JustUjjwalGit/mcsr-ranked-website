import { buildPageMetadata } from '@/lib/metadata'

export const metadata = buildPageMetadata({
  title: 'MCSR Ranked Players & Leaderboard',
  description:
    'Browse the MCSR Ranked player leaderboard, search competitors, and open detailed player profiles with Elo, records, and match history.',
  path: '/players',
})

export default function PlayersLayout({ children }: { children: React.ReactNode }) {
  return children
}
