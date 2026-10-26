import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/metadata'

interface PlayerLayoutProps {
  children: React.ReactNode
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: Pick<PlayerLayoutProps, 'params'>): Promise<Metadata> {
  const { username: rawUsername } = await params
  const username = rawUsername.trim() || 'Player'

  return buildPageMetadata({
    title: `${username} – MCSR Ranked Stats & Match History`,
    description: `View ${username}'s MCSR Ranked Elo, record, performance statistics, recent matches, and competitive history.`,
    path: `/player/${encodeURIComponent(username)}`,
  })
}

export default function PlayerLayout({ children }: PlayerLayoutProps) {
  return children
}
